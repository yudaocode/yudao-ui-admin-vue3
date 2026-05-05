// ====================================================================
// IM 会话 / 撤回展示 utility
// ====================================================================
// 基于 conversation 上下文 + sender 信息实时算"展示文案"。
// 1. 发送人名一律由 utils/user.getSenderDisplayName 实时算，本文件只负责拼"撤回 tip / 摘要"等文案。
// 2. fallbackName 由调用方传入（典型来源：Conversation.lastSenderDisplayName 快照），透传到 getSenderDisplayName 内部，算不出真名时兜底
// ====================================================================

import { ImMessageType, isFriendChatTip, isGroupNotification } from './constants'
import { parseMessage, type TextMessage } from './message'
import {
  getSenderDisplayName,
  resolveFriendNotificationText,
  resolveGroupNotificationText
} from './user'
import type { Message } from '../home/types'

/** 会话主键：`type-targetId` 拼成稳定字符串，给 v-for :key、active 比对、map key 等场景共用 */
export function getConversationKey(conversation: { type: number; targetId: number }): string {
  return `${conversation.type}-${conversation.targetId}`
}

/** 撤回提示文案：自己撤回固定文案，对方撤回带 sender 名（实时算 + fallbackName 兜底） */
export function buildRecallTip(
  senderId: number,
  selfSend: boolean,
  conversationType: number,
  conversationTargetId: number,
  fallbackName?: string
): string {
  if (selfSend) {
    return '你撤回了一条消息'
  }
  const senderDisplayName = getSenderDisplayName(
    senderId,
    conversationType,
    conversationTargetId,
    fallbackName
  )
  return `${senderDisplayName || '对方'} 撤回了一条消息`
}

/** 会话列表最后一条摘要：RECALL 走 buildRecallTip + fallbackName；其它按消息类型派生 */
export function resolveConversationLastContent(
  message: Message,
  conversationType: number,
  conversationTargetId: number,
  fallbackName?: string
): string {
  switch (message.type) {
    case ImMessageType.IMAGE:
      return '[图片]'
    case ImMessageType.FILE:
      return '[文件]'
    case ImMessageType.VOICE:
      return '[语音]'
    case ImMessageType.VIDEO:
      return '[视频]'
    case ImMessageType.RECALL:
      return buildRecallTip(
        message.senderId,
        message.selfSend,
        conversationType,
        conversationTargetId,
        fallbackName
      )
    case ImMessageType.TEXT:
      return parseMessage<TextMessage>(message.content)?.content ?? ''
    default:
      if (isFriendChatTip(message.type)) {
        return resolveFriendNotificationText(message)
      }
      if (isGroupNotification(message.type)) {
        return resolveGroupNotificationText(message)
      }
      return parseMessage<TextMessage>(message.content)?.content ?? ''
  }
}
