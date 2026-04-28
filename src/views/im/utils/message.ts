import { generateUUID } from '@/utils'

// ====================================================================
// IM 消息 content 编解码 & 展示工具
// ====================================================================
// 约定：消息的 content 字段统一存 JSON 字符串，字段名、结构对齐后端
// cn.iocoder.yudao.module.im.service.websocket.dto.message.* 下的 DTO。
// 各类消息 payload interface 字段对齐后端；解析统一用 parseMessage<T>，
// 序列化直接 JSON.stringify(payload)。
//
// 例外：TIP_TEXT（系统提示，群解散 / 退群 / 踢人 等）后端会直接发裸字符串，
//      展示侧需走 resolveTipText 兼容裸字符串 + 老接口可能的 {"content":"..."} 两种形态。
// ====================================================================

// ==================== 客户端 ID ====================

/** 生成客户端消息 ID（纯 UUID），用于前端去重 & ACK 回写 */
export const generateClientMessageId = (): string => {
  return generateUUID()
}

// ==================== 消息 payload ====================

/** 文本消息 payload（对齐后端 TextMessage） */
export interface TextMessage {
  content: string
}

/** 图片消息 payload（对齐后端 ImageMessage） */
export interface ImageMessage {
  url: string
  /** 缩略图 URL */
  thumbnailUrl?: string
  /** 图片宽度 */
  width?: number
  /** 图片高度 */
  height?: number
  /** 文件大小（字节） */
  size?: number
}

/** 语音消息 payload（对齐后端 AudioMessage；ImMessageType 保留 VOICE 命名） */
export interface AudioMessage {
  url: string
  /** 时长（秒） */
  duration: number
  /** 文件大小（字节） */
  size?: number
}

/** 文件消息 payload（对齐后端 FileMessage） */
export interface FileMessage {
  url: string
  name: string
  size: number
  /** MIME 类型 */
  type?: string
}

/** 视频消息 payload（对齐后端 VideoMessage；暂未接入渲染） */
export interface VideoMessage {
  url: string
  /** 封面 URL */
  coverUrl?: string
  /** 时长（秒） */
  duration?: number
  width?: number
  height?: number
  /** 文件大小（字节） */
  size?: number
}

/** 解析消息 content（JSON 字符串）为指定 payload，非法 JSON 返回 null */
export const parseMessage = <T>(content: string): T | null => {
  try {
    return JSON.parse(content) as T
  } catch {
    return null
  }
}

/** 序列化消息 payload 为 content JSON 字符串；与 parseMessage 对称 */
export const serializeMessage = <T>(payload: T): string => JSON.stringify(payload)

// ==================== TIP_TEXT ====================

/**
 * 解析 TIP_TEXT（系统提示）文案
 *
 * 后端：群解散 / 退群 / 踢人 等系统提示直接发裸字符串；老接口可能包成 {"content": "..."}。
 * 解析得到 .content 就用，否则当裸文案返回，避免出现空行。
 *
 * MessageItem / conversationStore.resolveLastContent / MessageHistory.renderContent 三处共用，
 * 修一处兼容性问题不会漏到另两处
 */
export const resolveTipText = (content: string): string => {
  const raw = content || ''
  if (!raw) {
    return ''
  }
  const parsed = parseMessage<TextMessage>(raw)
  if (parsed && typeof parsed.content === 'string') {
    return parsed.content
  }
  return raw
}

// ==================== 撤回 ====================

/**
 * 从后端下发的撤回 TIP_TEXT content 中解析出被撤回的原消息 id
 * content 形如 `{"messageId": 123}`，若不含 messageId 则返回 0（表示这条不是撤回 tip）
 */
export const parseRecallMessageId = (content: string): number => {
  try {
    const parsed = JSON.parse(content)
    return parsed?.messageId != null ? Number(parsed.messageId) : 0
  } catch {
    return 0
  }
}

// ==================== 新消息提示音 ====================

import tipAudioUrl from '@/assets/audio/im/message-tip.mp3'

/**
 * 新消息提示音，带 1 秒节流：短时间内多条消息只响一次，避免疲劳轰炸。
 *
 * 浏览器自动播放策略要求页面有过用户交互；若无法播放会静默失败。
 */
let __lastPlayAudioTipAt = 0
let __tipAudio: HTMLAudioElement | null = null
export const playAudioTip = () => {
  const now = Date.now()
  if (now - __lastPlayAudioTipAt < 1000) {
    return
  }
  __lastPlayAudioTipAt = now
  try {
    if (!__tipAudio) {
      __tipAudio = new Audio(tipAudioUrl)
      __tipAudio.preload = 'auto'
    }
    __tipAudio.currentTime = 0
    const playPromise = __tipAudio.play()
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((e) => console.debug('[IM] playAudioTip 失败', e))
    }
  } catch (e) {
    console.debug('[IM] playAudioTip 失败', e)
  }
}
