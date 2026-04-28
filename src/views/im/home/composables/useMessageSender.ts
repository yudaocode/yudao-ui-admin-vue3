import { useConversationStore } from '../store/conversationStore'
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
import { generateClientMessageId, serializeMessage, type TextMessage } from '../../utils/message'
import { ImMessageType, ImMessageStatus, ImConversationType } from '../../utils/constants'
import type { Message } from '../types'
import { useUserStore } from '@/store/modules/user'

/** 非文本消息的扩展选项（通用） */
interface SendExtOptions {
  atUserIds?: number[] // 群聊 @ 的用户编号列表
  receipt?: boolean // 是否需要群回执（默认 false）
  targetId?: number // 覆盖默认的 targetId
}

/**
 * 消息发送 / 撤回 / 已读 组合式逻辑
 *
 * 设计要点：
 * 1. 私聊 / 群聊接口签名对称，按 conversation.type 分支调度，差异在分支内部消化
 * 2. 发送走「乐观更新」：先 insertMessage 写入 SENDING 占位，请求成功 ackMessage 更新为 UNREAD，失败更新为 FAILED
 * 3. 撤回不做乐观更新：服务端通过 WebSocket RECALL 事件回传，由 websocketStore 统一更新状态，避免网络失败后不可回退
 * 4. 已读上报：本端立刻清未读数；服务端回包成功后再做持久化
 */
export const useMessageSender = () => {
  const conversationStore = useConversationStore()
  const userStore = useUserStore()

  /**构造本地乐观消息对象（id=0 表示尚未拿到服务端消息 id） */
  const buildLocalMessage = (opts: {
    clientMessageId: string
    content: string
    targetId: number
    type: number
    atUserIds?: number[]
  }): Message => {
    return {
      id: 0,
      clientMessageId: opts.clientMessageId,
      type: opts.type,
      content: opts.content,
      status: ImMessageStatus.SENDING,
      sendTime: Date.now(),
      senderId: Number(userStore.getUser?.id) || 0,
      targetId: opts.targetId,
      selfSend: true,
      atUserIds: opts.atUserIds
    }
  }

  /**
   * 发送任意类型的消息（底层实现）
   * 1. 文本、图片、文件、语音等都走这里
   * 2. type / content 由调用方构造
   */
  const sendRaw = async (type: number, content: string, options?: SendExtOptions) => {
    // 1. 参数校验：必须有激活会话和目标 id
    const conversation = conversationStore.activeConversation
    if (!conversation) {
      return
    }
    const realTarget = options?.targetId || conversation.targetId
    if (!realTarget) {
      return
    }

    // 2. 构造本地消息并乐观插入会话；状态先置 SENDING，请求结果回来由 ackMessage 更新
    const clientMessageId = generateClientMessageId()
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
    conversationStore.insertMessage(conversationInfo, message)

    // 3. 发送请求：按会话类型分发到不同接口；成功后 ackMessage 更新为 UNREAD，失败更新为 FAILED
    try {
      if (conversation.type === ImConversationType.PRIVATE) {
        const data = await apiSendPrivateMessage({
          clientMessageId,
          receiverId: realTarget,
          type,
          content
        })
        conversationStore.ackMessage(conversation.type, realTarget, clientMessageId, {
          id: data.id,
          sendTime: new Date(data.sendTime).getTime(),
          status: data.status
        })
      } else if (conversation.type === ImConversationType.GROUP) {
        const data = await apiSendGroupMessage({
          clientMessageId,
          groupId: realTarget,
          type,
          content,
          atUserIds: options?.atUserIds,
          receipt: options?.receipt
        })
        conversationStore.ackMessage(conversation.type, realTarget, clientMessageId, {
          id: data.id,
          sendTime: new Date(data.sendTime).getTime(),
          status: data.status,
          receiptStatus: data.receiptStatus,
          readCount: data.readCount
        })
      }
    } catch (e) {
      console.error('[IM] 消息发送失败', { type, realTarget, clientMessageId }, e)
      conversationStore.ackMessage(conversation.type, realTarget, clientMessageId, {
        status: ImMessageStatus.FAILED
      })
    }
  }

  /** 发送文本消息（最常用的快捷入口）：MessageInput.vue 文本回车走这里 */
  const send = async (text: string, options?: SendExtOptions) => {
    if (!text.trim()) {
      return
    }
    await sendRaw(ImMessageType.TEXT, serializeMessage<TextMessage>({ content: text }), options)
  }

  /**
   * 撤回某条消息
   * 1. 服务端会通过 WebSocket RECALL 事件回传，本端 UI 由 websocketStore 统一更新
   * 2. 此处不做乐观撤回，避免网络失败后状态不可回退
   */
  const recall = async (message: Message) => {
    // 参数校验：本地占位消息（id=0）不能撤回
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
   * 1. 本端立刻清未读数；服务端回包成功后再做持久化
   * 2. 已读位置取会话内最大真实消息 id（id=0 的本地发送中消息跳过）
   */
  const readActive = async () => {
    const conversation = conversationStore.activeConversation
    if (!conversation) {
      return
    }
    // 本地标记已读：未读数清零 + 消息状态更新为 READ（UI 立刻响应）
    conversationStore.markActiveAsRead()
    const maxMessageId = conversationStore.getActiveMessages.reduce<number>(
      (max, m) => (m.id > max ? m.id : max),
      0
    )
    if (!maxMessageId) {
      return
    }
    // 接口调用：私聊 / 群聊接口签名一致，按会话类型分发；失败仅记录日志，不回退本地已读状态
    const isPrivate = conversation.type === ImConversationType.PRIVATE
    try {
      await (isPrivate
        ? apiReadPrivateMessages(conversation.targetId, maxMessageId)
        : apiReadGroupMessages(conversation.targetId, maxMessageId))
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
    try {
      // 拉取对方已读到的最大消息 id
      const maxReadId = await apiGetPrivateMaxReadMessageId(peerId)
      if (!maxReadId) {
        return
      }
      // applyReadReceipt 内部把 ≤ maxReadId 的本端消息更新为 READ
      conversationStore.applyReadReceipt({
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
