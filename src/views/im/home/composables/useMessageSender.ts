import { useConversationStore } from '../store/conversationStore'
import { useMessageStore } from '../store/messageStore'
import {
  sendPrivateMessage as apiSendPrivateMessage,
  readPrivateMessages as apiReadPrivateMessages,
  getPrivateMaxReadMessageId as apiGetPrivateMaxReadMessageId,
  recallPrivateMessage as apiRecallPrivateMessage
} from '@/api/im/message/private'
import {
  sendGroupMessage as apiSendGroupMessage,
  readGroupMessages as apiReadGroupMessages,
  recallGroupMessage as apiRecallGroupMessage
} from '@/api/im/message/group'
import { readChannelMessages as apiReadChannelMessages } from '@/api/im/message/channel'
import {
  generateClientMessageId,
  serializeMessage,
  withQuotePayload,
  type QuoteMessage,
  type TextMessage
} from '../../utils/message'
import { ImContentType, ImMessageStatus, ImConversationType } from '../../utils/constants'
import { MESSAGE_PRIVATE_READ_ENABLED, MESSAGE_GROUP_READ_ENABLED } from '../../utils/config'
import { getClientConversationId } from '../../utils/db'
import type { Conversation, Message } from '../types'
import { getCurrentUserId } from '@/utils/auth'

/** 非文本消息的扩展选项（通用） */
interface SendExtOptions {
  atUserIds?: number[] // 群聊 @ 的用户编号列表
  receipt?: boolean // 是否需要群回执（默认 false）
  targetId?: number // 覆盖默认的 targetId
  /**
   * 显式指定目标会话（转发 / 名片推荐场景）
   *
   * 不传时默认取 conversationStore.activeConversation；传入时按本值发送 + 乐观更新到对应会话，
   * 不要求该会话当前是激活状态（适合发给「非当前会话」的多个目标）
   */
  conversation?: Conversation
  /** 被引用消息（可选）：写进 content.quote 用于乐观渲染，服务端按 quote.messageId 反查重算覆盖 */
  quote?: QuoteMessage
  /**
   * 复用已存在的本地占位消息 clientMessageId（媒体上传场景）
   *
   * 媒体上传链路在请求服务端前已经 insertMessage 了占位（带 blob URL + 进度条），
   * 这里跳过 buildLocalMessage / insertMessage，直接拿这个 id 走 ackMessage 收尾，避免重复插入两条
   */
  existingClientMessageId?: string
}

/**
 * 消息发送 / 撤回 / 已读 组合式逻辑
 *
 * 设计要点：
 * 1. 私聊 / 群聊接口签名对称，按 conversation.type 分支调度，差异在分支内部消化
 * 2. 发送走「乐观更新」：先 insertMessage 写入 SENDING 占位，请求成功 ackMessage 更新为 NORMAL，失败更新为 FAILED
 * 3. 撤回不做乐观更新：服务端通过 WebSocket RECALL 事件回传，由 websocketStore 统一更新状态，避免网络失败后不可回退
 * 4. 已读上报：本端立刻清未读数并记录本地读位置；接口失败仅记录日志
 */
export const useMessageSender = () => {
  const conversationStore = useConversationStore()
  const messageStore = useMessageStore()

  /** 构造本地乐观消息对象 */
  const buildLocalMessage = (opts: {
    clientMessageId: string
    content: string
    targetId: number
    type: number
    atUserIds?: number[]
  }): Message => {
    return {
      clientMessageId: opts.clientMessageId,
      type: opts.type,
      content: opts.content,
      status: ImMessageStatus.SENDING,
      sendTime: Date.now(),
      senderId: getCurrentUserId(),
      targetId: opts.targetId,
      selfSend: true,
      atUserIds: opts.atUserIds
    }
  }

  /**
   * 发送任意类型的消息（底层实现）
   * 1. 文本、图片、文件、语音等都走这里
   * 2. type / content 由调用方构造
   * 3. 返回值：成功 true / 失败 false（失败时本地占位已标 FAILED）；参数缺失等无法发送的场景也返 false
   *    转发 / 名片推荐等场景按返回值决定是否继续后续动作（如有留言时仅在名片成功后再发留言）
   */
  const sendRaw = async (
    type: number,
    content: string,
    options?: SendExtOptions
  ): Promise<boolean> => {
    // 1. 参数校验：优先用显式传入的 conversation（转发场景），否则取激活会话
    const conversation = options?.conversation ?? conversationStore.activeConversation
    if (!conversation) {
      return false
    }
    const realTarget = options?.targetId || conversation.targetId
    if (!realTarget) {
      return false
    }

    // 2. 准备 clientMessageId：媒体上传链路在 step 1 已经 insertMessage 占位，这里直接复用 id；其余场景走默认乐观插入
    let clientMessageId: string
    if (options?.existingClientMessageId) {
      clientMessageId = options.existingClientMessageId
      // 占位若已被删除（上传期间用户右键删除 / 撤回 / removeMessage 等）则放弃发送，
      // 否则 sendRaw 仍会把消息推到服务端，导致"本地无气泡 / 对方却收到一条"
      const stillExists = messageStore
        .getMessageList(conversation.type, realTarget)
        .some((message) => message.clientMessageId === clientMessageId && !message._ackMerging)
      if (!stillExists) {
        return false
      }
    } else {
      clientMessageId = generateClientMessageId()
      const message = buildLocalMessage({
        clientMessageId,
        content,
        targetId: realTarget,
        type,
        atUserIds: options?.atUserIds
      })
      const conversationInfo = {
        type: conversation.type,
        targetId: realTarget,
        name: conversation.name || String(realTarget),
        avatar: conversation.avatar || ''
      }
      void messageStore.insertMessage(conversationInfo, message).catch(() => undefined)
    }

    // 3. 发送请求：按会话类型分发到不同接口；成功后 ackMessage 更新为 NORMAL，失败更新为 FAILED
    try {
      if (conversation.type === ImConversationType.PRIVATE) {
        const data = await apiSendPrivateMessage({
          clientMessageId,
          receiverId: realTarget,
          type,
          content
        })
        void messageStore
          .ackMessage(conversation.type, realTarget, clientMessageId, {
            id: data.id,
            sendTime: new Date(data.sendTime).getTime(),
            status: data.status,
            receiptStatus: data.receiptStatus,
            content: data.content
          })
          .catch(() => undefined)
      } else if (conversation.type === ImConversationType.GROUP) {
        const data = await apiSendGroupMessage({
          clientMessageId,
          groupId: realTarget,
          type,
          content,
          atUserIds: options?.atUserIds,
          receipt: options?.receipt
        })
        void messageStore
          .ackMessage(conversation.type, realTarget, clientMessageId, {
            id: data.id,
            sendTime: new Date(data.sendTime).getTime(),
            status: data.status,
            receiptStatus: data.receiptStatus,
            readCount: data.readCount,
            content: data.content
          })
          .catch(() => undefined)
      }
      return true
    } catch (e) {
      console.error('[IM] 消息发送失败', { type, realTarget, clientMessageId }, e)
      void messageStore
        .ackMessage(conversation.type, realTarget, clientMessageId, {
          status: ImMessageStatus.FAILED
        })
        .catch(() => undefined)
      return false
    }
  }

  /**
   * 发送文本消息（最常用的快捷入口）：MessageInput.vue 文本回车走这里
   * 返回值：成功 true / 失败 false / 空文本 false（与 sendRaw 对齐，转发场景按返回值判断）
   */
  const send = async (text: string, options?: SendExtOptions): Promise<boolean> => {
    if (!text.trim()) {
      return false
    }
    const payload = withQuotePayload<TextMessage>({ content: text }, options?.quote)
    return sendRaw(ImContentType.TEXT, serializeMessage(payload), options)
  }

  /**
   * 撤回某条消息
   * 1. 服务端会通过 WebSocket RECALL 事件回传，本端 UI 由 websocketStore 统一更新
   * 2. 此处不做乐观撤回，避免网络失败后状态不可回退
   */
  const recall = async (message: Message) => {
    // 参数校验：本地占位消息不能撤回
    if (!message.id) {
      return
    }
    const conversation = conversationStore.activeConversation
    if (!conversation) {
      return
    }
    // 私聊 / 群聊接口签名一致，按会话类型分发
    const isPrivate = conversation.type === ImConversationType.PRIVATE
    try {
      await (isPrivate ? apiRecallPrivateMessage(message.id) : apiRecallGroupMessage(message.id))
    } catch (e) {
      console.error('[IM] 撤回失败', { messageId: message.id, type: conversation.type }, e)
    }
  }

  /**
   * 触发当前会话的已读上报（切会话 / 进入页面时调用）
   * 1. 本端立刻清未读数并推进读位置
   * 2. 已读位置取已加载消息和会话末条消息的最大服务端 id
   */
  const readActive = async () => {
    const conversation = conversationStore.activeConversation
    if (!conversation) {
      return
    }
    const loadedMaxMessageId = messageStore
      .getMessages(getClientConversationId(conversation.type, conversation.targetId))
      .reduce<number>(
        (maxMessageId, message) =>
          message.id && message.id > maxMessageId ? message.id : maxMessageId,
        0
      )
    const maxMessageId = Math.max(loadedMaxMessageId, conversation.lastMessageId || 0)
    const readReported = conversationStore.isReportedReadPositionCovered(
      conversation.type,
      conversation.targetId,
      maxMessageId
    )
    if (readReported) {
      conversationStore.markConversationRead(conversation.type, conversation.targetId)
      return
    }
    const isPrivate = conversation.type === ImConversationType.PRIVATE
    const isGroup = conversation.type === ImConversationType.GROUP
    const isChannel = conversation.type === ImConversationType.CHANNEL
    // 本地标记已读：未读数清零（UI 立刻响应）
    conversationStore.markConversationRead(conversation.type, conversation.targetId, maxMessageId)
    if (!maxMessageId) {
      return
    }
    // 接口调用：按会话类型分发，并按对应已读开关控制
    if (!isPrivate && !isGroup && !isChannel) {
      return
    }
    if (isPrivate && !MESSAGE_PRIVATE_READ_ENABLED) {
      return
    }
    if (isGroup && !MESSAGE_GROUP_READ_ENABLED) {
      return
    }
    try {
      if (isPrivate) {
        await apiReadPrivateMessages(conversation.targetId, maxMessageId)
      } else if (isGroup) {
        await apiReadGroupMessages(conversation.targetId, maxMessageId)
      } else {
        await apiReadChannelMessages(conversation.targetId, maxMessageId)
      }
      conversationStore.markConversationReadReported(
        conversation.type,
        conversation.targetId,
        maxMessageId
      )
    } catch (e) {
      console.error(
        '[IM] 标记已读失败',
        { type: conversation.type, targetId: conversation.targetId, maxMessageId },
        e
      )
    }
  }

  /**
   * 拉取「对方已读到我哪条消息」并补齐本地状态
   *
   * 1. 弥补离线 / 多端期间错过的 RECEIPT 推送：进入私聊会话或断线重连后调一次，
   *    把对方 maxReadId 同步到本地消息 status，避免对方明明读了、本端却仍显示未读
   * 2. 仅私聊使用：群聊已读位置在每条消息的 readCount / receiptStatus 字段，离线拉取自带回
   */
  const syncPrivateReadStatus = async (peerId: number) => {
    if (!peerId) {
      return
    }
    // 私聊已读关闭：跳过对方已读位置同步，避免无谓接口调用
    if (!MESSAGE_PRIVATE_READ_ENABLED) {
      return
    }
    const cachedMaxReadId = messageStore.getPrivateReadMaxId(peerId)
    if (cachedMaxReadId !== undefined) {
      if (cachedMaxReadId > 0) {
        messageStore.applyMessageReadReceipt({
          conversationType: ImConversationType.PRIVATE,
          targetId: peerId,
          privateReadMaxId: cachedMaxReadId
        })
      }
      return
    }
    try {
      // 拉取对方已读到的最大消息 id
      const maxReadId = await apiGetPrivateMaxReadMessageId(peerId)
      messageStore.updatePrivateReadMaxId(peerId, maxReadId)
      if (!maxReadId) {
        return
      }
      // applyMessageReadReceipt 内部把 ≤ maxReadId 的本端消息回执更新为 DONE
      messageStore.applyMessageReadReceipt({
        conversationType: ImConversationType.PRIVATE,
        targetId: peerId,
        privateReadMaxId: maxReadId
      })
    } catch (e) {
      console.warn('[IM] 拉取对方已读位置失败', { peerId }, e)
    }
  }

  return { send, sendRaw, recall, readActive, syncPrivateReadStatus }
}
