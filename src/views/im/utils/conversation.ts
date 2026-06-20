// ====================================================================
// IM 会话 / 撤回展示 utility
// ====================================================================
// 基于 conversation 上下文 + sender 信息实时算"展示文案"。
// 1. 发送人名一律由 utils/user.getSenderDisplayName 实时算，本文件只负责拼"撤回 tip / 摘要"等文案。
// 2. fallbackName 由调用方传入（典型来源：Conversation.lastSenderDisplayName 快照），透传到 getSenderDisplayName 内部，算不出真名时兜底
// ====================================================================

import {
  ImConversationType,
  ImContentType,
  isFriendChatTip,
  isGroupNotification,
  isRtcCallTip
} from './constants'
import {
  getCardLabelInfo,
  parseMessage,
  segmentsToText,
  tipMention,
  tipText,
  type CardMessage,
  type FaceMessage,
  type FileMessage,
  type MaterialMessage,
  type TextMessage,
  type TipSegment
} from './message'
import { getSenderDisplayName } from './user'
import {
  resolveFriendNotificationText,
  resolveGroupNotificationText,
  resolveRtcCallLastContent
} from './message'
import type { Message } from '../home/types'

/** 会话主键：`type-targetId` 拼成稳定字符串，给 v-for :key、active 比对、map key 等场景共用 */
export function getConversationKey(conversation: { type: number; targetId: number }): string {
  return `${conversation.type}-${conversation.targetId}`
}

/** 按昵称模糊过滤会话列表：空 keyword 原样返回，命中走 toLowerCase 不区分大小写 */
export function filterConversationsByKeyword<T extends { name?: string }>(
  list: T[],
  keyword: string
): T[] {
  const trimmed = keyword.trim().toLowerCase()
  if (!trimmed) {
    return list
  }
  return list.filter((c) => (c.name || '').toLowerCase().includes(trimmed))
}

/**
 * 表情消息的统一文本预览：摘要 / 历史搜索 / 引用块 / 管理后台预览共用一份
 * 有 name 时走 `[表情] name`（系统包），无 name 时走 `[表情]`（个人表情通常无 name）
 */
export function buildFacePreviewText(facePayload: { name?: string } | null | undefined): string {
  return facePayload?.name ? `[表情] ${facePayload.name}` : '[表情]'
}

/**
 * 撤回提示 segments
 *
 * senderId 缺失时不挂 mention 段，避免点出错号；算不出真名降级为「对方」纯文本
 */
export function buildRecallTipSegments(
  senderId: number,
  selfSend: boolean,
  conversationType: number,
  conversationTargetId: number,
  fallbackName?: string
): TipSegment[] {
  if (selfSend) {
    return [tipText('你撤回了一条消息')]
  }
  const senderDisplayName = getSenderDisplayName(
    senderId,
    conversationType,
    conversationTargetId,
    fallbackName
  )
  if (!senderId) {
    return [tipText(`${senderDisplayName || '对方'} 撤回了一条消息`)]
  }
  return [tipMention(senderId, senderDisplayName || '对方'), tipText(' 撤回了一条消息')]
}

/** 撤回提示文案：自己撤回固定文案，对方撤回带 sender 名（实时算 + fallbackName 兜底） */
export function buildRecallTip(
  senderId: number,
  selfSend: boolean,
  conversationType: number,
  conversationTargetId: number,
  fallbackName?: string
): string {
  return segmentsToText(
    buildRecallTipSegments(senderId, selfSend, conversationType, conversationTargetId, fallbackName)
  )
}

/**
 * 单条消息的纯文本摘要；不依赖 conversation 上下文
 *
 * - withFileName=true 时文件消息附带文件名（合并转发详情用）
 * - 不处理 RECALL / 群广播 / 好友通知，由调用方包一层
 */
export function summarizeMessageContent(
  message: Pick<Message, 'type' | 'content'>,
  opts?: { withFileName?: boolean }
): string {
  switch (message.type) {
    case ImContentType.TEXT:
      return parseMessage<TextMessage>(message.content)?.content ?? ''
    case ImContentType.IMAGE:
      return '[图片]'
    case ImContentType.VOICE:
      return '[语音]'
    case ImContentType.VIDEO:
      return '[视频]'
    case ImContentType.FILE: {
      if (opts?.withFileName) {
        const file = parseMessage<FileMessage>(message.content)
        return file?.name ? `[文件] ${file.name}` : '[文件]'
      }
      return '[文件]'
    }
    case ImContentType.CARD:
      return `[${getCardLabelInfo(parseMessage<CardMessage>(message.content)).label}]`
    case ImContentType.FACE:
      return buildFacePreviewText(parseMessage<FaceMessage>(message.content))
    case ImContentType.MERGE:
      return '[聊天记录]'
    case ImContentType.MATERIAL: {
      const material = parseMessage<MaterialMessage>(message.content)
      return material?.title ? `[频道] ${material.title}` : '[频道]'
    }
    case ImContentType.RTC_CALL_START:
    case ImContentType.RTC_CALL_END:
      return '[语音通话]'
    default:
      return ''
  }
}

/** 会话列表最后一条摘要：RECALL 走 buildRecallTip + fallbackName；其它按内容类型派生 */
export function resolveConversationLastContent(
  message: Message,
  conversationType: number,
  conversationTargetId: number,
  fallbackName?: string
): string {
  if (message.type === ImContentType.RECALL) {
    return buildRecallTip(
      message.senderId,
      message.selfSend,
      conversationType,
      conversationTargetId,
      fallbackName
    )
  }
  if (isFriendChatTip(message.type)) {
    return resolveFriendNotificationText(message)
  }
  if (isGroupNotification(message.type)) {
    return resolveGroupNotificationText(message, (id) =>
      getSenderDisplayName(id, ImConversationType.GROUP, message.targetId ?? 0)
    )
  }
  if (isRtcCallTip(message.type)) {
    return resolveRtcCallLastContent(message, conversationType)
  }
  return summarizeMessageContent(message)
}
