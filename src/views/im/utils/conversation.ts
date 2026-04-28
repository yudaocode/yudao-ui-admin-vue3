// ====================================================================
// IM 会话 / 撤回展示 utility
// ====================================================================
// 职责：基于会话上下文 + sender 信息实时算"展示文案"。
// 之前这些值是写入消息时固化到 Message.senderShowName / Conversation.senderShowName，
// 改备注 / 改群昵称后历史消息不会刷新；改成实时算后字段语义彻底干净。
//
// 与 utils/user.ts 的关系：
//   user.ts 回答"谁叫什么名字"，conversation.ts 在它基础上拼"撤回 tip / 摘要"等文案
// ====================================================================

import { ImMessageType } from './constants'
import { parseMessage, resolveTipText, type TextMessage } from './message'
import { getSenderDisplayName } from './user'
import type { Message } from '../home/types'

/**
 * 撤回提示文案：自己撤回固定 "你撤回了一条消息"，对方撤回带按 WeChat 优先级算的发送人名
 *
 * 发送人名一律实时算（改备注 / 改群昵称后立即刷新），store 没 ready 时由
 * getSenderDisplayName 内部退到 String(senderId)，最差兜底显示"对方"
 */
export function buildRecallTip(
  senderId: number,
  selfSend: boolean,
  conversationType: number,
  conversationTargetId: number
): string {
  if (selfSend) {
    return '你撤回了一条消息'
  }
  const senderDisplayName = getSenderDisplayName(senderId, conversationType, conversationTargetId)
  return `${senderDisplayName || '对方'} 撤回了一条消息`
}

/**
 * 根据消息类型计算会话列表最后一条摘要
 *
 * RECALL 分支走实时 buildRecallTip（不再依赖 message 上的 senderShowName 快照）；
 * 其它分支照旧由 message.content 派生
 */
export function resolveConversationLastContent(
  message: Message,
  conversationType: number,
  conversationTargetId: number
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
        conversationTargetId
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
