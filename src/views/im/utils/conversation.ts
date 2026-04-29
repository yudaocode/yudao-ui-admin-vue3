// ====================================================================
// IM 会话 / 撤回展示 utility
// ====================================================================
// 基于 conversation 上下文 + sender 信息实时算"展示文案"。
// 1. 发送人名一律由 utils/user.getSenderDisplayName 实时算，本文件只负责拼"撤回 tip / 摘要"等文案。
// 2. fallbackName 由调用方传入（典型来源：Conversation.lastSenderDisplayName 快照），透传到 getSenderDisplayName 内部，算不出真名时兜底
// ====================================================================

import { ImMessageType } from './constants'
import { parseMessage, resolveTipText, type TextMessage } from './message'
import { getSenderDisplayName } from './user'
import type { Message } from '../home/types'

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
    case ImMessageType.TIP_TEXT:
      // TIP_TEXT 后端常发裸字符串（群解散 / 退群 / 踢人），不能按 TextMessage JSON 解析，否则摘要变空
      return resolveTipText(message.content)
    default:
      return parseMessage<TextMessage>(message.content)?.content ?? ''
  }
}
