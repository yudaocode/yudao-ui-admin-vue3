// ====================================================================
// IM 会话 / 撤回展示 utility
// ====================================================================
// TODO @AI：这里的注释，不用写历史，只写当下。
// 职责：基于会话上下文 + sender 信息实时算"展示文案"。
// 历史上 Message / Conversation 上有 senderShowName 快照字段，改备注 / 改群昵称后历史消息
// 不会刷新；现在 Message 不再带任何名字快照，发送人名一律由 utils/user.getSenderDisplayName
// 实时算。Conversation.lastSenderDisplayName 仅作 fallback 快照（解决"没打开过的群"
// members 没加载时的兜底显示），通过 fallback 参数透传到本文件的 buildRecallTip /
// resolveConversationLastContent 而非内部硬编码读取
//
// 与 utils/user.ts 的关系：
//   user.ts 回答"谁叫什么名字"，conversation.ts 在它基础上拼"撤回 tip / 摘要"等文案
// ====================================================================

import { ImMessageType } from './constants'
import { parseMessage, resolveTipText, type TextMessage } from './message'
import { getSenderDisplayName } from './user'
import type { Message } from '../home/types'

/** 撤回提示文案：自己撤回固定文案，对方撤回带 sender 名（实时算 + fallback 兜底） */
// TODO @AI：fallbackName
export function buildRecallTip(
  senderId: number,
  selfSend: boolean,
  conversationType: number,
  conversationTargetId: number,
  fallback?: string
): string {
  if (selfSend) {
    return '你撤回了一条消息'
  }
  const senderDisplayName = getSenderDisplayName(
    senderId,
    conversationType,
    conversationTargetId,
    fallback
  )
  return `${senderDisplayName || '对方'} 撤回了一条消息`
}

/** 会话列表最后一条摘要：RECALL 走 buildRecallTip + fallback；其它按消息类型派生 */
export function resolveConversationLastContent(
  message: Message,
  conversationType: number,
  conversationTargetId: number,
  fallback?: string
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
        fallback
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
