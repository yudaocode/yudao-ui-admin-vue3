import { updateFile } from '@/api/infra/file'
import { useUserStore } from '@/store/modules/user'

import { useConversationStore } from '../store/conversationStore'
import { useMessageSender } from './useMessageSender'
import { useMuteOverlay } from './useMuteOverlay'
import { ImMessageStatus } from '../../utils/constants'
import { getConversationKey } from '../../utils/conversation'
import {
  generateClientMessageId,
  serializeMessage,
  withQuotePayload,
  type QuoteMessage
} from '../../utils/message'
import type { Conversation, Message } from '../types'

/** 单次媒体上传的入参（image / file / voice 共用；video 走低层 helper 自行组装） */
export interface UploadAndSendMediaOptions<P extends { quote?: QuoteMessage }> {
  file: File
  type: number // 对齐 ImMessageType
  kind: string // 文案：「图片」/「文件」/「语音」，仅日志用
  /** 由 url 生成消息 payload；占位阶段传 blob URL，上传成功后再用真实 url 重生成 */
  buildPayload: (url: string) => P
  /** 引用消息（若有），写进 payload.quote */
  quote?: QuoteMessage
  /** 锁定起始会话，上传期间会话切走则放弃发送 */
  conversation: Conversation
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
export const useMediaUploader = () => {
  const conversationStore = useConversationStore()
  const userStore = useUserStore()
  const muteOverlay = useMuteOverlay()
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
  }): { clientMessageId: string; blobUrl: string } => {
    const { conversation } = opts
    const blobUrl = URL.createObjectURL(opts.file)
    const clientMessageId = generateClientMessageId()
    const placeholder: Message = {
      id: 0,
      clientMessageId,
      type: opts.type,
      content: opts.buildContent(blobUrl),
      status: ImMessageStatus.SENDING,
      sendTime: Date.now(),
      senderId: Number(userStore.getUser?.id) || 0,
      targetId: conversation.targetId,
      selfSend: true,
      uploadProgress: 0,
      _localFile: opts.file
    }
    conversationStore.insertMessage(
      {
        type: conversation.type,
        targetId: conversation.targetId,
        name: conversation.name || String(conversation.targetId),
        avatar: conversation.avatar || ''
      },
      placeholder
    )
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
    conversationStore.patchMessage(conversationType, targetId, clientMessageId, {
      status: ImMessageStatus.FAILED,
      uploadProgress: undefined
    })
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
    conversationStore.patchMessage(
      opts.conversation.type,
      opts.conversation.targetId,
      opts.clientMessageId,
      { content: opts.realContent }
    )
    await sendRaw(opts.type, opts.realContent, {
      existingClientMessageId: opts.clientMessageId,
      targetId: opts.conversation.targetId
    })
  }

  /**
   * 上传媒体文件并发送消息（高层入口；image / file / voice 用）
   *
   * @returns 占位消息的 clientMessageId（调用方按需用于后续 patch / 移除；上传失败时占位仍保留为 FAILED 态）
   */
  const uploadAndSendMedia = async <P extends { quote?: QuoteMessage }>(
    opts: UploadAndSendMediaOptions<P>
  ): Promise<string> => {
    const { conversation } = opts
    const startKey = getConversationKey(conversation)

    // 1. 立即占位
    const { clientMessageId } = insertMediaPlaceholder({
      file: opts.file,
      type: opts.type,
      conversation,
      buildContent: (blobUrl) =>
        serializeMessage(withQuotePayload<P>(opts.buildPayload(blobUrl), opts.quote))
    })

    // 2. 上传：进度回调 patch uploadProgress；失败保留 _localFile 供重试
    let url: string | undefined
    try {
      const form = new FormData()
      form.append('file', opts.file)
      const res = (await updateFile(form, (event: ProgressEvent) => {
        if (!event.total) {
          return
        }
        const percent = Math.round((event.loaded / event.total) * 100)
        conversationStore.patchMessage(conversation.type, conversation.targetId, clientMessageId, {
          uploadProgress: percent
        })
      })) as { data?: string }
      url = res?.data
    } catch (e) {
      console.error(`[IM] ${opts.kind}上传失败`, e)
    }
    if (!url) {
      markMediaFailed(conversation.type, conversation.targetId, clientMessageId)
      return clientMessageId
    }

    // 3. 上传期间会话切换 / 用户登出 / 被禁言：任一情况都放弃发送，占位置 FAILED
    const activeConversation = conversationStore.activeConversation
    if (!activeConversation || getConversationKey(activeConversation) !== startKey) {
      console.warn(`[IM] ${opts.kind}上传期间切换了会话，放弃发送`, { startKey })
      markMediaFailed(conversation.type, conversation.targetId, clientMessageId)
      return clientMessageId
    }
    if (muteOverlay.value) {
      console.warn(`[IM] ${opts.kind}上传期间被禁言，放弃发送`, { startKey })
      markMediaFailed(conversation.type, conversation.targetId, clientMessageId)
      return clientMessageId
    }

    // 4. patch content + sendRaw 收尾
    const realContent = serializeMessage(
      withQuotePayload<P>(opts.buildPayload(url), opts.quote)
    )
    await commitMediaPlaceholder({
      type: opts.type,
      conversation,
      clientMessageId,
      realContent
    })
    return clientMessageId
  }

  return { uploadAndSendMedia, insertMediaPlaceholder, markMediaFailed, commitMediaPlaceholder }
}
