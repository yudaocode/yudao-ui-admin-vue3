import { generateUUID } from '@/utils'
import { ImMessageType } from './constants'
import type { Message } from '../home/types'

// ====================================================================
// IM 消息 content 编解码 & 展示工具
// ====================================================================
// 约定：消息的 content 字段统一存 JSON 字符串，字段名、结构对齐后端
// cn.iocoder.yudao.module.im.service.websocket.dto.message.* 下的 DTO。
// 各类消息 payload interface 字段对齐后端；解析统一用 parseMessage<T>，
// 序列化直接 JSON.stringify(payload)。
// ====================================================================

// ==================== 客户端 ID ====================

/** 生成客户端消息 ID（纯 UUID），用于前端去重 & ACK 回写 */
export const generateClientMessageId = (): string => {
  return generateUUID()
}

// ==================== 引用消息 ====================

/** 引用消息 payload(对齐后端 QuoteMessage) */
export interface QuoteMessage {
  messageId: number
  senderId: number
  type: number
  content: string
}

/** 引用容器：5 种普通消息(TEXT / IMAGE / FILE / VOICE / VIDEO)都可携带 quote */
interface Quotable {
  quote?: QuoteMessage
}

// ==================== 消息 payload ====================

/** 文本消息 payload（对齐后端 TextMessage） */
export interface TextMessage extends Quotable {
  content: string
}

/** 图片消息 payload（对齐后端 ImageMessage） */
export interface ImageMessage extends Quotable {
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
export interface AudioMessage extends Quotable {
  url: string
  /** 时长（秒） */
  duration: number
  /** 文件大小（字节） */
  size?: number
}

/** 文件消息 payload（对齐后端 FileMessage） */
export interface FileMessage extends Quotable {
  url: string
  name: string
  size: number
  /** MIME 类型 */
  type?: string
}

/** 视频消息 payload（对齐后端 VideoMessage；暂未接入渲染） */
export interface VideoMessage extends Quotable {
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

/** 名片消息 payload（对齐后端 CardMessage） */
export interface CardMessage extends Quotable {
  /** 名片用户编号 */
  userId: number
  /** 名片用户昵称（取真实昵称，非备注） */
  nickname: string
  /** 名片用户头像 */
  avatar?: string
}

/** 表情消息 payload（对齐后端 FaceMessage；Unicode emoji 仍走 TEXT，本类型只承载贴图 / 自定义表情包） */
export interface FaceMessage extends Quotable {
  /** 表情图 URL */
  url: string
  /** 渲染宽度（像素），避免布局抖动；可选，缺失时调用方走 CSS max-w 兜底 */
  width?: number
  /** 渲染高度（像素），可选 */
  height?: number
  /** 表情名（系统包通常有，个人表情包通常无） */
  name?: string
}

/** 「添加到表情」的可发起源：FACE / IMAGE 都允许（GIF 图片也常被收藏） */
export interface AddableFacePayload {
  url: string
  width: number
  height: number
  name?: string
}

/**
 * 从消息抽取「添加到表情」的 payload；当前消息类型不可添加返回 null
 *
 * 调用方（MessageItem 的右键菜单）按 nullable 决定是否展示「添加到表情」入口
 */
export function extractAddableFace(message: Message): AddableFacePayload | null {
  if (message.type === ImMessageType.FACE) {
    const face = parseMessage<FaceMessage>(message.content)
    if (!face?.url) {
      return null
    }
    return { url: face.url, width: face.width || 200, height: face.height || 200, name: face.name }
  }
  if (message.type === ImMessageType.IMAGE) {
    const image = parseMessage<ImageMessage>(message.content)
    if (!image?.url) {
      return null
    }
    return { url: image.url, width: image.width || 200, height: image.height || 200 }
  }
  return null
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

/** `URL.createObjectURL(file)` 生成的 URL 前缀；占位 / revoke / 重传旧值识别共用 */
export const BLOB_URL_PREFIX = 'blob:'

/**
 * 媒体 payload 里可能包含 blob URL 的字段（图片/文件/视频/语音都对齐这套 url 字段命名）
 *
 * 跟随 ImageMessage / VideoMessage / FileMessage / AudioMessage interface 定义同步：
 * - url：主体资源（占位时是 blob URL，ack 后是真实 URL）
 * - coverUrl：视频封面（commit 后是真实 URL；占位阶段不设以避免传 blob 当 poster 在部分浏览器退化）
 * - thumbnailUrl：图片缩略图（当前未占位时使用 blob，预留）
 */
const MEDIA_BLOB_URL_FIELDS = ['url', 'coverUrl', 'thumbnailUrl'] as const

/**
 * 释放 content 中媒体 payload 字段上的 blob URL 内存映射
 *
 * 仅扫描 url / coverUrl / thumbnailUrl 三个已知字段，避免 regex 全文 grep 误伤 quote.content 里嵌套的同名 blob URL。
 * 仅对当前 document 内创建的 blob URL 有效；IndexedDB 恢复出来的旧 blob URL 已随旧 document 失效，调它无害但无意义
 */
export const revokeBlobUrlsInContent = (content: string): void => {
  if (!content || !content.includes(BLOB_URL_PREFIX)) {
    return
  }
  const payload = parseMessage<Record<string, unknown>>(content)
  if (!payload) {
    return
  }
  for (const field of MEDIA_BLOB_URL_FIELDS) {
    const value = payload[field]
    if (typeof value === 'string' && value.startsWith(BLOB_URL_PREFIX)) {
      URL.revokeObjectURL(value)
    }
  }
}

// ==================== 引用消息 helper ====================

/** 把 quote 合进 payload(序列化前调用);quote 缺失时原样返回 */
export const withQuotePayload = <T extends Quotable>(payload: T, quote?: QuoteMessage): T => {
  if (!quote) {
    return payload
  }
  return { ...payload, quote }
}

/**
 * 从 content JSON 字符串里清掉 quote 字段
 *
 * 客户端乐观渲染构造 quote 时调用,避免"回复一条带引用的消息"造成 quote 嵌套滚雪球;
 * 与后端 ImMessageUtils.removeQuote 对齐
 */
export const removeQuotePayload = (content: string): string => {
  if (!content || !content.includes('"quote"')) {
    return content
  }
  const parsed = parseMessage<Record<string, unknown>>(content)
  if (!parsed || !('quote' in parsed)) {
    return content
  }
  delete parsed.quote
  return JSON.stringify(parsed)
}

/** 由 Message 派生 QuoteMessage 用于乐观渲染;ack 后会被服务端权威版本覆盖 */
export const buildQuoteFromMessage = (message: Message): QuoteMessage => {
  return {
    messageId: message.id,
    senderId: message.senderId,
    type: message.type,
    content: removeQuotePayload(message.content)
  }
}

/** 从已序列化 message.content 中解出 quote;非 JSON / 无 quote 返回 null */
export const getQuoteFromMessage = (content: string): QuoteMessage | null => {
  // 长会话每条消息渲染都走 quote computed,非引用消息字符串预扫直接返回,免一次 JSON.parse
  if (!content || !content.includes('"quote"')) {
    return null
  }
  const parsed = parseMessage<Quotable>(content)
  return parsed?.quote ?? null
}

// ==================== 撤回 ====================

/**
 * 从后端下发的撤回 RecallMessage content 中解析出被撤回的原消息 id
 * content 形如 `{"messageId": 123}`，若不含 messageId 则返回 0（表示这条不是撤回消息）
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

// ==================== 文件图标 ====================

/**
 * 按文件扩展名挑文件图标 + 颜色，对齐微信观感
 *
 * MessageItem.vue（主气泡）和 ReplyPreview.vue（引用预览）共用同一份映射，避免视觉两处不一致
 */
export function getFileIconInfo(filename: string | undefined): { icon: string; color: string } {
  const ext = (filename || '').split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf') {
    return { icon: 'ant-design:file-pdf-filled', color: '#ed5757' }
  }
  if (['doc', 'docx'].includes(ext)) {
    return { icon: 'ant-design:file-word-filled', color: '#2b7cd3' }
  }
  if (['xls', 'xlsx'].includes(ext)) {
    return { icon: 'ant-design:file-excel-filled', color: '#1f7244' }
  }
  if (['ppt', 'pptx'].includes(ext)) {
    return { icon: 'ant-design:file-ppt-filled', color: '#d24726' }
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return { icon: 'ant-design:file-zip-filled', color: '#f0ad4e' }
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
    return { icon: 'ant-design:file-image-filled', color: '#9c27b0' }
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv'].includes(ext)) {
    return { icon: 'ant-design:video-camera-filled', color: '#9c27b0' }
  }
  if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
    return { icon: 'ant-design:audio-filled', color: '#9c27b0' }
  }
  if (['txt', 'md', 'log', 'json', 'xml'].includes(ext)) {
    return { icon: 'ant-design:file-text-filled', color: '#909399' }
  }
  return { icon: 'ant-design:file-filled', color: '#909399' }
}

// ==================== 管理后台展示工具 ====================

/** 详情弹窗里把 content JSON 美化成 2 缩进 */
export const formatJson = (content?: string): string => {
  if (!content) return ''
  try {
    return JSON.stringify(JSON.parse(content), null, 2)
  } catch {
    return content
  }
}
