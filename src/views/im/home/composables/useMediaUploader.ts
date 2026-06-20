import { updateFile } from '@/api/infra/file'
import { getCurrentUserId } from '@/utils/auth'
import { useMessage } from '@/hooks/web/useMessage'
import { isOpenableUrl } from '@/utils/url'

import { useConversationStore } from '../store/conversationStore'
import { useMessageStore } from '../store/messageStore'
import { useMessageSender } from './useMessageSender'
import { useMuteOverlay } from './useMuteOverlay'
import { ImMessageStatus, ImContentType } from '../../utils/constants'
import {
  MESSAGE_FILE_MAX_MB,
  MESSAGE_IMAGE_MAX_MB,
  MESSAGE_VIDEO_MAX_MB,
  MESSAGE_VOICE_MAX_MB
} from '../../utils/config'
import { getConversationKey } from '../../utils/conversation'
import {
  BLOB_URL_PREFIX,
  generateClientMessageId,
  parseMessage,
  serializeMessage,
  withQuotePayload,
  type AudioMessage,
  type FileMessage,
  type ImageMessage,
  type QuoteMessage,
  type VideoMessage
} from '../../utils/message'
import type { Conversation, Message } from '../types'

/** 单条媒体 payload 联合（覆盖 IMAGE / FILE / VOICE / VIDEO 四种） */
export type MediaPayload = ImageMessage | FileMessage | AudioMessage | VideoMessage

/**
 * 媒体特定的元数据上下文：首发 / 重传共用入参；不同 type 关心不同字段
 *
 * - voiceDuration：语音时长（秒），首发由 VoiceRecorder 给，重传从旧 AudioMessage.duration 取
 * - videoProbe：视频元信息（首发由 probeVideoFile 解出，重传从旧 VideoMessage 直接拷字段）
 * - videoCoverUrl：视频封面真实 URL；占位阶段不设（避免传 blob 当 poster 在部分浏览器退化），commit 阶段由 cover 上传结果填入；重传时从旧 VideoMessage.coverUrl 复用，旧值若是 blob 会被跳过
 */
export interface MediaTypeContext {
  voiceDuration?: number
  videoProbe?: { duration?: number; width?: number; height?: number }
  videoCoverUrl?: string
}

export interface MediaTypeHandler {
  /** 中文名，仅日志用（替代之前散落 9 处的 kind 字符串） */
  kind: string
  /** 由 file + url + context 生成 payload；占位时 url 是 blob URL，commit 时是真实 url */
  build: (file: File, url: string, context: MediaTypeContext) => MediaPayload
  /** 重传场景：从旧 content 提取 context（让重传不需要重做 probe / 重录语音） */
  extractResendContext: (oldContent: string) => MediaTypeContext
}

/** 媒体类型注册表：image / file / voice / video 各自的 kind + 首发 / 重传共用的 build / extract */
export const mediaTypeHandlers: Partial<Record<number, MediaTypeHandler>> = {
  [ImContentType.IMAGE]: {
    kind: '图片',
    build: (_file, url) => ({ url }) as ImageMessage,
    extractResendContext: () => ({})
  },
  [ImContentType.FILE]: {
    kind: '文件',
    build: (file, url) => ({ url, name: file.name, size: file.size }) as FileMessage,
    extractResendContext: () => ({})
  },
  [ImContentType.VOICE]: {
    kind: '语音',
    build: (_file, url, context) => ({ url, duration: context.voiceDuration ?? 0 }) as AudioMessage,
    extractResendContext: (oldContent) => {
      const old = parseMessage<AudioMessage>(oldContent)
      return { voiceDuration: old?.duration ?? 0 }
    }
  },
  [ImContentType.VIDEO]: {
    kind: '视频',
    build: (file, url, context) =>
      ({
        url,
        coverUrl: context.videoCoverUrl,
        duration: context.videoProbe?.duration,
        width: context.videoProbe?.width,
        height: context.videoProbe?.height,
        size: file.size
      }) as VideoMessage,
    extractResendContext: (oldContent) => {
      const old = parseMessage<VideoMessage>(oldContent)
      // 旧 coverUrl 是 blob 说明上传期失败（cover 没传成功），不复用；真实 URL 直接复用，省一次封面上传
      const reuseCover =
        old?.coverUrl && !old.coverUrl.startsWith(BLOB_URL_PREFIX) ? old.coverUrl : undefined
      return {
        videoProbe: { duration: old?.duration, width: old?.width, height: old?.height },
        videoCoverUrl: reuseCover
      }
    }
  }
}

/** 单次媒体上传的入参（image / file / voice 走 uploadAndSendMedia；video 走低层 helper 自行组装） */
export interface UploadAndSendMediaOptions {
  file: File
  /** 对齐 ImContentType；mediaTypeHandlers 必须有对应项 */
  type: number
  /** 媒体特定的元数据（如语音时长 / 视频元信息）；不传按空对象处理 */
  context?: MediaTypeContext
  /** 引用消息（若有），写进 payload.quote */
  quote?: QuoteMessage
  /** 锁定起始会话，上传期间会话切走则放弃发送 */
  conversation: Conversation
  /** 重试已有占位消息时复用的客户端消息编号 */
  existingClientMessageId?: string
}

/**
 * 媒体上传 + 发送 composable（image / file / voice / video 共用底层 helper）
 *
 * 与 useMessageSender.sendRaw 的「先发请求再 ack」不同，媒体链路必须「先占位再上传」：
 * 1. 立即 insertMessage 写入占位消息（status=SENDING、content 用 blob URL、_localFile 内存留 File）
 * 2. updateFile 上传，onUploadProgress 回调 patchMessage 更新 uploadProgress；UI 实时显示进度条
 * 3. 上传成功后用真实 url 重生 content，patchMessage 替换；旧 blob URL 由 store 自动 revoke
 * 4. 走 sendRaw(existingClientMessageId) 复用占位发送请求，避免重复插入两条
 *
 * 任意失败把消息状态置 FAILED；MessageItem 上点重试再走一次本函数（_localFile 还在内存就行）
 */
/** 按内容类型映射体积上限（MB）；未识别类型返回 0 表示不限 */
function resolveMediaMaxMb(type: number): number {
  switch (type) {
    case ImContentType.IMAGE:
      return MESSAGE_IMAGE_MAX_MB
    case ImContentType.VIDEO:
      return MESSAGE_VIDEO_MAX_MB
    case ImContentType.VOICE:
      return MESSAGE_VOICE_MAX_MB
    case ImContentType.FILE:
      return MESSAGE_FILE_MAX_MB
    default:
      return 0
  }
}

/** 校验媒体文件大小是否超过内容类型上限；超限触发 warn 并返回 false，调用方不应进入占位 / 上传链路 */
export function ensureMediaSizeWithinLimit(
  file: File,
  type: number,
  warn: (text: string) => void
): boolean {
  const maxMb = resolveMediaMaxMb(type)
  if (maxMb && file.size > maxMb * 1024 * 1024) {
    warn(`文件大小超过上限 ${maxMb}MB，请压缩后再发`)
    return false
  }
  return true
}

export const useMediaUploader = () => {
  const conversationStore = useConversationStore()
  const messageStore = useMessageStore()
  const muteOverlay = useMuteOverlay()
  const message = useMessage()
  const { sendRaw } = useMessageSender()

  /**
   * 立即写入媒体占位消息（低层 helper；image/file/voice 走 uploadAndSendMedia 包装，video 直接用本函数）
   *
   * 用 createObjectURL(file) 生成临时 blob URL 喂给 buildContent；占位 status=SENDING + uploadProgress=0；
   * file 挂在 _localFile 上供失败重试时重走上传
   */
  const insertMediaPlaceholder = (opts: {
    file: File
    type: number
    conversation: Conversation
    buildContent: (blobUrl: string) => string
    existingClientMessageId?: string
  }): { clientMessageId: string; blobUrl: string } => {
    const { conversation } = opts
    const blobUrl = URL.createObjectURL(opts.file)
    const clientMessageId = opts.existingClientMessageId || generateClientMessageId()
    if (opts.existingClientMessageId) {
      messageStore.patchMessage(conversation.type, conversation.targetId, clientMessageId, {
        content: opts.buildContent(blobUrl),
        status: ImMessageStatus.SENDING,
        uploadProgress: 0,
        _localFile: opts.file
      })
      return { clientMessageId, blobUrl }
    }
    const placeholder: Message = {
      clientMessageId,
      type: opts.type,
      content: opts.buildContent(blobUrl),
      status: ImMessageStatus.SENDING,
      sendTime: Date.now(),
      senderId: getCurrentUserId(),
      targetId: conversation.targetId,
      selfSend: true,
      uploadProgress: 0,
      _localFile: opts.file
    }
    void messageStore
      .insertMessage(
        {
          type: conversation.type,
          targetId: conversation.targetId,
          name: conversation.name || String(conversation.targetId),
          avatar: conversation.avatar || ''
        },
        placeholder
      )
      .catch(() => undefined)
    return { clientMessageId, blobUrl }
  }

  /**
   * 把占位消息置为 FAILED（上传失败 / 会话切走 / 禁言期到点 等场景统一收尾）
   *
   * 同时清掉 uploadProgress —— 失败后 MessageItem 的 isUploading 不再命中，进度遮罩 / 文件点击禁用 / 语音 loading 抑制 都同步解除；
   * _localFile 保留，让用户点重试可以走 uploadAndSendMedia 重传
   */
  const markMediaFailed = (
    conversationType: number,
    targetId: number,
    clientMessageId: string
  ): void => {
    messageStore.patchMessage(conversationType, targetId, clientMessageId, {
      status: ImMessageStatus.FAILED,
      uploadProgress: undefined
    })
  }

  /**
   * 生成 axios `onUploadProgress` 回调：用 closure 缓存上次百分比，未变化直接 return 不进 store
   *
   * XHR onProgress 大文件下每秒触发 10-50 次，但 Math.round 后百分比有大量重复（一秒内可能十几次同一个数字）；
   * 在源头去重，能省掉 store 的 find + Object.assign + Vue reactivity 触发链
   */
  const createUploadProgressHandler = (conversation: Conversation, clientMessageId: string) => {
    let lastPercent = -1
    return (event: ProgressEvent): void => {
      if (!event.total) {
        return
      }
      const percent = Math.round((event.loaded / event.total) * 100)
      if (percent === lastPercent) {
        return
      }
      lastPercent = percent
      messageStore.patchMessage(conversation.type, conversation.targetId, clientMessageId, {
        uploadProgress: percent
      })
    }
  }

  /** 取媒体类型中文名（仅日志用）；未注册 type 退化为通用「媒体」 */
  const getMediaKind = (type: number): string => mediaTypeHandlers[type]?.kind ?? '媒体'

  /**
   * 按 type 取 handler，缺则抛错（程序错误集中在这一处）
   *
   * 调用方拿到的是 `MediaTypeHandler`（非 undefined），不再需要 `!` 断言。
   * 仅给「确定 type 在表里」的调用方用 —— image/file/voice/video 四类入口；通用 dispatcher 仍可用 `mediaTypeHandlers[type]?.` optional chain
   */
  const requireMediaHandler = (type: number): MediaTypeHandler => {
    const handler = mediaTypeHandlers[type]
    if (!handler) {
      throw new Error(`[IM] 未注册的媒体类型 ${type}`)
    }
    return handler
  }

  /**
   * 上传完成后的收口校验：会话仍是占位时锁定的那个 + 当前未被禁言；任一不满足 markMediaFailed + 返回 false
   *
   * image / file / voice / video 链路都要在「拿到真实 url 后、调 sendRaw 之前」过一遍这两道
   */
  const verifyMediaUploadStillAllowed = (
    conversation: Conversation,
    startKey: string,
    type: number,
    clientMessageId: string
  ): boolean => {
    const activeConversation = conversationStore.activeConversation
    if (!activeConversation || getConversationKey(activeConversation) !== startKey) {
      console.warn(`[IM] ${getMediaKind(type)}上传期间切换了会话，放弃发送`, { startKey })
      markMediaFailed(conversation.type, conversation.targetId, clientMessageId)
      return false
    }
    if (muteOverlay.value) {
      console.warn(`[IM] ${getMediaKind(type)}上传期间被禁言，放弃发送`, { startKey })
      markMediaFailed(conversation.type, conversation.targetId, clientMessageId)
      return false
    }
    return true
  }

  /**
   * 占位完成后用真实 url 替换 content，再走 sendRaw 完成发送
   *
   * 上传成功 → patch content → sendRaw 复用 existingClientMessageId；store 内部 revoke 旧 blob URL
   */
  const commitMediaPlaceholder = async (opts: {
    type: number
    conversation: Conversation
    clientMessageId: string
    realContent: string
  }): Promise<void> => {
    messageStore.patchMessage(
      opts.conversation.type,
      opts.conversation.targetId,
      opts.clientMessageId,
      { content: opts.realContent }
    )
    // 显式传 conversation 而非依赖 sendRaw 内部取 active：
    // verifyMediaUploadStillAllowed 与 sendRaw 之间存在微秒窗口，期间用户切会话也能保证发到原会话
    await sendRaw(opts.type, opts.realContent, {
      existingClientMessageId: opts.clientMessageId,
      targetId: opts.conversation.targetId,
      conversation: opts.conversation
    })
  }

  /**
   * 上传媒体文件并发送消息（高层入口；image / file / voice 用，video 走低层 helper 自行组装）
   *
   * @returns 占位消息的 clientMessageId（调用方按需用于后续 patch / 移除；上传失败时占位仍保留为 FAILED 态）
   */
  const uploadAndSendMedia = async (opts: UploadAndSendMediaOptions): Promise<string> => {
    const { conversation } = opts
    const handler = mediaTypeHandlers[opts.type]
    if (!handler) {
      console.warn('[IM] uploadAndSendMedia 收到未注册的媒体类型', { type: opts.type })
      return ''
    }
    // 体积上限拦截：大文件浏览器内截帧 / 解码可致 OOM；超限直接 warning，不进入占位 / 上传链路
    if (!ensureMediaSizeWithinLimit(opts.file, opts.type, message.warning)) {
      return ''
    }
    const startKey = getConversationKey(conversation)
    const context = opts.context ?? {}
    const buildContent = (url: string): string =>
      serializeMessage(withQuotePayload(handler.build(opts.file, url, context), opts.quote))

    // 1. 立即占位
    const { clientMessageId } = insertMediaPlaceholder({
      file: opts.file,
      type: opts.type,
      conversation,
      buildContent,
      existingClientMessageId: opts.existingClientMessageId
    })

    // 2. 上传：进度回调 patch uploadProgress；失败保留 _localFile 供重试
    let url: string | undefined
    try {
      const form = new FormData()
      form.append('file', opts.file)
      const res = (await updateFile(
        form,
        createUploadProgressHandler(conversation, clientMessageId)
      )) as { data?: string }
      url = res?.data
    } catch (e) {
      console.error(`[IM] ${handler.kind}上传失败`, e)
    }
    if (!url) {
      markMediaFailed(conversation.type, conversation.targetId, clientMessageId)
      return clientMessageId
    }
    if (!isOpenableUrl(url)) {
      console.warn(`[IM] ${handler.kind}上传返回了不支持打开的 URL`, { url })
      message.warning('上传返回的文件地址不支持打开')
      markMediaFailed(conversation.type, conversation.targetId, clientMessageId)
      return clientMessageId
    }

    // 3. 上传期间会话切换 / 用户登出 / 被禁言：任一情况都放弃发送，占位置 FAILED
    if (!verifyMediaUploadStillAllowed(conversation, startKey, opts.type, clientMessageId)) {
      return clientMessageId
    }

    // 4. patch content + sendRaw 收尾
    await commitMediaPlaceholder({
      type: opts.type,
      conversation,
      clientMessageId,
      realContent: buildContent(url)
    })
    return clientMessageId
  }

  return {
    uploadAndSendMedia,
    insertMediaPlaceholder,
    markMediaFailed,
    commitMediaPlaceholder,
    createUploadProgressHandler,
    verifyMediaUploadStillAllowed,
    getMediaKind,
    requireMediaHandler
  }
}
