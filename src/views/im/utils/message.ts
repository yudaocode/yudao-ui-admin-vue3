import { generateUUID } from '@/utils'
import { useUserStore } from '@/store/modules/user'
import {
  ImRtcCallEndReason,
  ImConversationType,
  ImContentType,
  type ImConversationTypeValue
} from './constants'
import { getCurrentUserId } from '@/utils/auth'
import { formatCallDuration } from './time'
import { useFriendStore } from '../home/store/friendStore'
import { useGroupStore } from '../home/store/groupStore'
import type { Conversation, Message, User, GroupLite, QuoteMessage } from '../home/types'

export type { QuoteMessage } from '../home/types'

// ====================================================================
// IM 消息 content 编解码 & 展示工具
// ====================================================================
// 约定：消息的 content 字段统一存 JSON 字符串，字段名、结构对齐后端
// cn.iocoder.yudao.module.im.service.websocket.notification.message.* 下的 DTO。
// 各类消息 payload interface 字段对齐后端；解析统一用 parseMessage<T>，
// 序列化直接 JSON.stringify(payload)。
// ====================================================================

// ==================== 客户端 ID ====================

/** 生成客户端消息 ID（纯 UUID），用于前端去重 & ACK 回写 */
export const generateClientMessageId = (): string => {
  return generateUUID()
}

// ==================== 私聊对端 userId ====================

/**
 * 私聊消息 / DTO 的对端 userId：自己发的对端是 receiver，别人发的对端是 sender
 *
 * 收口 4 处旧 inline（websocketStore.convertPrivateMessage / handlePrivateMessage / computeFriendPeerId
 * 和 useMessagePuller.getPrivatePeerId），结构类型只要 senderId / receiverId 两个字段，REST 与 WS DTO 都满足
 */
export function getPrivateMessagePeerId(
  message: { senderId: number; receiverId: number },
  currentUserId: number
): number {
  return message.senderId === currentUserId ? message.receiverId : message.senderId
}

// ==================== 文本片段（tip 文案 + TEXT 气泡共用） ====================
// 既用于灰条 tip（"XX 邀请 YY 加入群聊"），也用于 TEXT 气泡正文（@xxx 高亮 + URL 自动识别）。
// mention 段携带 userId 用于挂点击弹 UserInfoCard；link 段携带 href 用于 <a> 跳转；
// text 段是纯文本兜底。渲染层（TipSegments.vue）按 type 分发统一处理。

export type TipSegment =
  | { type: 'text'; text: string }
  | { type: 'mention'; userId: number; text: string }
  | { type: 'link'; href: string; text: string }

export const tipText = (text: string): TipSegment => ({ type: 'text', text })

export const tipMention = (userId: number, text: string): TipSegment => ({
  type: 'mention',
  userId,
  text
})

export const tipLink = (href: string, text: string): TipSegment => ({
  type: 'link',
  href,
  text
})

export const segmentsToText = (segments: TipSegment[]): string =>
  segments.map((s) => s.text).join('')

/** 多个 userId 用同一个分隔符插值成 segments，每个 user 单独成 mention 段 */
export function joinMentionSegments(
  userIds: number[],
  separator: string,
  resolveName: (userId: number) => string
): TipSegment[] {
  return userIds.flatMap((id, index) =>
    index === 0
      ? [tipMention(id, resolveName(id))]
      : [tipText(separator), tipMention(id, resolveName(id))]
  )
}

/** mention 候选；name 用于匹配文本字面量，displayName 用于覆盖渲染（不传则按 name 渲染） */
export interface MentionCandidate {
  userId: number
  /** 用来在 content 中前缀匹配的字面量（不含 @） */
  name: string
  /**
   * 渲染时强制使用的显示名（不含 @）
   *
   * 用于「历史消息 content 里写的是备注名 / 群昵称，但接收端要按真实昵称渲染」的场景；
   * 候选可以携带多种字面量（match 用），但 displayName 统一指向 nickname，
   * 让所有历史 / 新消息的 @ 都收敛到一致的展示
   */
  displayName?: string
  /**
   * 歧义标记：同 name 对应多个 userId 时为 true
   *
   * parser 仍会按 name 命中（最长优先），但命中后整段吃成普通文本——
   * 避免「@张三」被剔除后，短前缀候选「@张」抢匹配错绑
   */
  ambiguous?: boolean
}

/** URL 锚定正则；终止于空白、中文、@（避免吞掉下一个 mention）、< > " '（防 HTML / 引号串入）；y 标志走 sticky 匹配，省 text.slice */
const URL_STICKY_REGEX = /(https?:\/\/[^\s一-龥@<>"']+|www\.[^\s一-龥@<>"']+)/iy

/** URL 末尾常见标点剔除，避免吞掉句末中英文标点 */
const URL_TRAILING_PUNCTUATION = /[.,!?;:)\]、，。！？；：）】]+$/

/** 最短 URL：`www.ab` / `http:/` 这种孤段不算链接 */
const URL_MIN_LENGTH = 6

/**
 * 文本气泡 content 拆段：mention 段按候选最长前缀匹配，URL 段走锚定正则，剩余归 text
 *
 * mentions 不传或匹配不上时，@xxx 退化为普通 text；解析与渲染解耦，工具函数本身不依赖 store
 */
export function parseTextSegments(text: string, mentions: MentionCandidate[] = []): TipSegment[] {
  if (!text) {
    return []
  }
  // 「@张三丰」不能被「@张三」截胡，候选按 name 长度倒序
  const sortedMentions =
    mentions.length > 1 ? [...mentions].sort((a, b) => b.name.length - a.name.length) : mentions
  const out: TipSegment[] = []
  let buffer = ''

  const flush = () => {
    if (buffer) {
      out.push(tipText(buffer))
      buffer = ''
    }
  }

  let i = 0
  while (i < text.length) {
    if (text[i] === '@' && sortedMentions.length > 0) {
      const matched = sortedMentions.find((m) => m.name && text.startsWith(m.name, i + 1))
      if (matched) {
        if (matched.ambiguous) {
          // 同字面量对应多 userId，无法判定意图；整段累入 buffer 让短前缀候选没机会再扫这段
          buffer += '@' + matched.name
        } else {
          flush()
          // 渲染统一走 displayName（即真实昵称），让历史 content 里残留的备注 / 群昵称也收敛到 nickname
          out.push(tipMention(matched.userId, '@' + (matched.displayName || matched.name)))
        }
        i += 1 + matched.name.length
        continue
      }
    }
    const head = text[i]
    if (head === 'h' || head === 'H' || head === 'w' || head === 'W') {
      URL_STICKY_REGEX.lastIndex = i
      const linkMatch = URL_STICKY_REGEX.exec(text)
      if (linkMatch) {
        const urlText = linkMatch[0].replace(URL_TRAILING_PUNCTUATION, '')
        if (urlText.length >= URL_MIN_LENGTH) {
          flush()
          const href = /^https?:\/\//i.test(urlText) ? urlText : `https://${urlText}`
          out.push(tipLink(href, urlText))
          i += urlText.length
          continue
        }
      }
    }
    buffer += text[i]
    i += 1
  }
  flush()
  return out
}

// ==================== 引用消息 ====================

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

/** 语音消息 payload（对齐后端 AudioMessage；ImContentType 保留 VOICE 命名） */
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

/**
 * 名片消息 payload（对齐后端 CardMessage）
 *
 * 按 targetType 区分用户名片 / 群名片：
 * - PRIVATE：targetId = 用户编号，name = 用户昵称（取真实昵称，非备注）
 * - GROUP：targetId = 群编号，name = 群名，可带 memberCount
 */
export interface CardMessage extends Quotable {
  /** 名片对象类型 */
  targetType: ImConversationTypeValue
  /** 目标对象编号：PRIVATE 时 = userId；GROUP 时 = groupId */
  targetId: number
  /** 显示名快照：PRIVATE 时 = 用户昵称；GROUP 时 = 群名 */
  name: string
  /** 头像（快照） */
  avatar?: string
  /** 群成员数（仅 targetType = GROUP；接收端展示「N 人群聊」） */
  memberCount?: number
}

/**
 * 名片转发的源对象（RecommendCardDialog 入参）；字段与 CardMessage 1:1，无 quote
 */
export type CardTarget = Omit<CardMessage, 'quote'>

/** 用户对象 → 用户名片源（PRIVATE）；缺 id 返回 null 让调用方 v-bind 绑定为不渲染 */
export function toUserCardTarget(user: User | null | undefined): CardTarget | null {
  if (!user?.id) {
    return null
  }
  return {
    targetType: ImConversationType.PRIVATE,
    targetId: user.id,
    name: user.nickname || '',
    avatar: user.avatar
  }
}

/** 群对象 → 群名片源（GROUP）；缺 id 返回 null */
export function toGroupCardTarget(group: GroupLite | null | undefined): CardTarget | null {
  if (!group?.id) {
    return null
  }
  return {
    targetType: ImConversationType.GROUP,
    targetId: group.id,
    name: group.name || '',
    avatar: group.showImage || group.showImageThumb,
    memberCount: group.memberCount
  }
}

/**
 * 名片标签 + 图标（按 targetType 二分），统一聊天气泡 / 引用预览 / 历史摘要 / 后台预览的文案与图标
 *
 * 缺失 / 非法 targetType 走「个人名片」兜底，避免老消息或脏数据导致 UI 空白
 */
export function getCardLabelInfo(card: { targetType?: number } | null | undefined): {
  label: string
  icon: string
} {
  if (card?.targetType === ImConversationType.GROUP) {
    return { label: '群名片', icon: 'ant-design:usergroup-outlined' }
  }
  return { label: '个人名片', icon: 'ant-design:user-outlined' }
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

/** 合并转发的单条内嵌消息快照（对齐后端 MergeMessage.Item） */
export interface MergeMessageItem {
  /** 原消息编号；仅做溯源标识 */
  messageId: number
  /** 发送人编号 */
  senderId: number
  /** 发送人昵称快照；对端可能不在原会话里，无法实时查到 */
  senderNickname: string
  /** 发送人头像快照 */
  senderAvatar?: string
  /** 内容类型，对齐 ImContentType */
  type: number
  /** 原消息 content（JSON）；嵌套合并消息时仍按本结构层层展开 */
  content: string
  /** 发送时间戳（毫秒） */
  sendTime: number
}

/** 合并转发消息 payload（对齐后端 MergeMessage） */
export interface MergeMessage {
  title: string // 合并标题；例：「张三和李四的聊天记录」「群聊的聊天记录」
  messages: MergeMessageItem[] // 内嵌的完整消息快照
}

/** 频道素材消息 payload（对齐后端 MaterialMessage） */
export interface MaterialMessage {
  materialId?: number
  channelId?: number // 频道编号；转发后渲染卡片底部的频道头像 + 名称
  title?: string
  coverUrl?: string
  summary?: string
  url?: string // 跳转链接；为空时点击在客户端内置详情页按 materialId 拉 content 渲染；非空则跳 url
}

// ==================== 合并转发 payload 构造 ====================

/** 单个发送人的快照昵称 / 头像 */
interface SenderSnapshot {
  nickname: string
  avatar: string
}

/**
 * 一次性构造 senderId → SenderSnapshot 映射；避免 N 条消息逐条 find 群成员
 *
 * 群聊从 group.members 一次性 indexBy；私聊只需 self + friend；外加全体 senderId 上做 friend 兜底
 */
function buildSenderSnapshotMap(
  senderIds: number[],
  conversation: Conversation
): Map<number, SenderSnapshot> {
  const userStore = useUserStore()
  const friendStore = useFriendStore()
  const selfUserId = getCurrentUserId()
  const result = new Map<number, SenderSnapshot>()

  let groupMembers: Map<number, { nickname: string; avatar?: string }> | null = null
  if (conversation.type === ImConversationType.GROUP) {
    const group = useGroupStore().getGroup(conversation.targetId)
    groupMembers = new Map((group?.members || []).map((m) => [m.userId, m]))
  }

  for (const senderId of senderIds) {
    if (result.has(senderId)) {
      continue
    }
    if (senderId === selfUserId) {
      result.set(senderId, {
        nickname: userStore.getUser?.nickname || String(senderId),
        avatar: userStore.getUser?.avatar || ''
      })
      continue
    }
    const member = groupMembers?.get(senderId)
    if (member?.nickname) {
      result.set(senderId, { nickname: member.nickname, avatar: member.avatar || '' })
      continue
    }
    const friend = friendStore.getFriend(senderId)
    result.set(senderId, {
      nickname: friend?.nickname || String(senderId),
      avatar: friend?.avatar || ''
    })
  }
  return result
}

/** 把单条 Message 转成 MergeMessageItem 快照；剥离 quote 防引用穿透 */
function mapMessageToMergeItem(
  message: Message,
  senderSnapshots: Map<number, SenderSnapshot>
): MergeMessageItem {
  const snapshot = senderSnapshots.get(message.senderId)
  return {
    messageId: message.id || 0,
    senderId: message.senderId,
    senderNickname: snapshot?.nickname ?? String(message.senderId),
    senderAvatar: snapshot?.avatar ?? '',
    type: message.type,
    content: removeQuotePayload(message.content),
    sendTime: message.sendTime
  }
}

/** 合并转发标题：私聊「{对方} 和 {自己} 的聊天记录」；群聊「{群名} 的聊天记录」 */
export function buildMergeTitle(conversation: Conversation): string {
  if (conversation.type === ImConversationType.GROUP) {
    return `${conversation.name || '群聊'} 的聊天记录`
  }
  const myName = useUserStore().getUser?.nickname || '我'
  return `${conversation.name || '对方'} 和 ${myName} 的聊天记录`
}

/** 把一组 Message 打包成 MergeMessage payload；调用方负责按 sendTime 排序后传入 */
export function buildMergeMessagePayload(
  messages: Message[],
  conversation: Conversation
): MergeMessage {
  const senderIds = messages.map((m) => m.senderId)
  const senderSnapshots = buildSenderSnapshotMap(senderIds, conversation)
  return {
    title: buildMergeTitle(conversation),
    messages: messages.map((m) => mapMessageToMergeItem(m, senderSnapshots))
  }
}

/** 「添加到表情」的可发起源：FACE / IMAGE 都允许（GIF 图片也常被收藏） */
export interface AddableFacePayload {
  url: string
  width: number
  height: number
  name?: string
}

/**
 * 从消息抽取「添加到表情」的 payload；当前内容类型不可添加返回 null
 *
 * 调用方（MessageItem 的右键菜单）按 nullable 决定是否展示「添加到表情」入口
 */
export function extractAddableFace(message: Message): AddableFacePayload | null {
  if (message.type === ImContentType.FACE) {
    const face = parseMessage<FaceMessage>(message.content)
    if (!face?.url) {
      return null
    }
    return { url: face.url, width: face.width || 200, height: face.height || 200, name: face.name }
  }
  if (message.type === ImContentType.IMAGE) {
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
    messageId: message.id || 0,
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

// ==================== 群广播事件 payload + 文案 ====================

// 群广播事件 payload；对齐后端 GroupNotificationMessage 子类聚合字段
export type GroupNotificationPayload = {
  operatorUserId?: number
  memberUserIds?: number[]
  newOwnerUserId?: number
  oldName?: string
  newName?: string
  oldNotice?: string
  newNotice?: string
  oldAvatar?: string
  newAvatar?: string
  oldJoinApproval?: boolean
  newJoinApproval?: boolean
  displayUserName?: string
  messageId?: number
  // 禁言事件
  mutedUserId?: number
  muteEndTime?: string
  // 全群封禁
  banned?: boolean
  // 自由进群事件
  entrantUserId?: number
  addSource?: number
  // PIN 事件携带的被置顶消息展示数据
  message?: {
    id: number
    senderId: number
    groupId: number
    type: number
    content: string
    sendTime: string
    atUserIds?: number[]
    receiverUserIds?: number[]
  }
}

/**
 * 群广播事件 segments
 *
 * resolveName 由调用方注入（默认场景传 getSenderDisplayName）；
 * operatorNameOverride 仅覆盖 operator 段文案，mention userId 仍用 payload.operatorUserId
 */
export function resolveGroupNotificationSegments(
  message: { type?: number; content?: string; targetId?: number },
  resolveName: (userId: number) => string,
  operatorNameOverride?: string
): TipSegment[] {
  let payload: GroupNotificationPayload = {}
  try {
    payload = JSON.parse(message.content || '{}')
  } catch {
    return []
  }
  // ENTER 主语是 entrant 而非 operator，独立处理；其它 case 都以 operatorUserId 为主语
  if (message.type === ImContentType.GROUP_MEMBER_ENTER) {
    const entrantId = payload.entrantUserId ?? payload.operatorUserId
    return entrantId ? [tipMention(entrantId, resolveName(entrantId)), tipText(' 加入了群聊')] : []
  }
  if (!payload.operatorUserId) {
    return []
  }
  const operatorSegment = tipMention(
    payload.operatorUserId,
    operatorNameOverride ?? resolveName(payload.operatorUserId)
  )
  const memberSegments = joinMentionSegments(payload.memberUserIds || [], '、', resolveName)

  switch (message.type) {
    case ImContentType.GROUP_CREATE:
      return [operatorSegment, tipText(' 创建了群聊')]
    case ImContentType.GROUP_NAME_UPDATE:
      return [operatorSegment, tipText(` 将群名修改为 "${payload.newName ?? ''}"`)]
    case ImContentType.GROUP_NOTICE_UPDATE:
      return [operatorSegment, tipText(' 更新了群公告')]
    case ImContentType.GROUP_INFO_UPDATE:
      return payload.newAvatar
        ? [operatorSegment, tipText(' 更换了群头像')]
        : [operatorSegment, tipText(' 更新了群信息')]
    case ImContentType.GROUP_DISSOLVE:
      return [operatorSegment, tipText(' 解散了群聊')]
    case ImContentType.GROUP_MEMBER_INVITE:
      return [operatorSegment, tipText(' 邀请 '), ...memberSegments, tipText(' 加入群聊')]
    case ImContentType.GROUP_MEMBER_QUIT:
      return [operatorSegment, tipText(' 退出了群聊')]
    case ImContentType.GROUP_MEMBER_KICK:
      return [operatorSegment, tipText(' 移出了 '), ...memberSegments]
    case ImContentType.GROUP_MEMBER_NICKNAME_UPDATE:
      return [operatorSegment, tipText(` 修改群昵称为 "${payload.displayUserName ?? ''}"`)]
    case ImContentType.GROUP_ADMIN_ADD:
      return [operatorSegment, tipText(' 将 '), ...memberSegments, tipText(' 设为管理员')]
    case ImContentType.GROUP_ADMIN_REMOVE:
      return [operatorSegment, tipText(' 撤销了 '), ...memberSegments, tipText(' 的管理员身份')]
    case ImContentType.GROUP_OWNER_TRANSFER:
      return payload.newOwnerUserId
        ? [
            operatorSegment,
            tipText(' 已将群主转让给 '),
            tipMention(payload.newOwnerUserId, resolveName(payload.newOwnerUserId))
          ]
        : []
    case ImContentType.GROUP_MESSAGE_PIN:
      return [operatorSegment, tipText(' 置顶了一条消息')]
    case ImContentType.GROUP_MESSAGE_UNPIN:
      return [operatorSegment, tipText(' 取消了一条置顶消息')]
    case ImContentType.GROUP_MEMBER_MUTED:
      return payload.mutedUserId
        ? [
            operatorSegment,
            tipText(' 将 '),
            tipMention(payload.mutedUserId, resolveName(payload.mutedUserId)),
            tipText(' 禁言')
          ]
        : []
    case ImContentType.GROUP_MEMBER_CANCEL_MUTED:
      return payload.mutedUserId
        ? [
            operatorSegment,
            tipText(' 解除了 '),
            tipMention(payload.mutedUserId, resolveName(payload.mutedUserId)),
            tipText(' 的禁言')
          ]
        : []
    case ImContentType.GROUP_MUTED:
      return [operatorSegment, tipText(' 开启了全群禁言')]
    case ImContentType.GROUP_CANCEL_MUTED:
      return [operatorSegment, tipText(' 关闭了全群禁言')]
    case ImContentType.GROUP_BANNED:
      return [operatorSegment, tipText(payload.banned ? ' 封禁了该群' : ' 解封了该群')]
    default:
      return []
  }
}

/** 群广播事件中文文案 */
export function resolveGroupNotificationText(
  message: { type?: number; content?: string; targetId?: number },
  resolveName: (userId: number) => string,
  operatorNameOverride?: string
): string {
  return segmentsToText(
    resolveGroupNotificationSegments(message, resolveName, operatorNameOverride)
  )
}

// ==================== 好友事件 ====================

/** 会话内好友事件 segments */
export function resolveFriendNotificationSegments(message: { type?: number }): TipSegment[] {
  switch (message.type) {
    case ImContentType.FRIEND_ADD:
      return [tipText('你们已经是好友了，开始聊天吧')]
    case ImContentType.FRIEND_DELETE:
      return [tipText('你已删除好友')]
    default:
      return []
  }
}

/** 会话内好友事件文案：FRIEND_ADD / FRIEND_DELETE 渲染成灰色提示气泡，文案固定不依赖 payload */
export function resolveFriendNotificationText(message: { type?: number }): string {
  return segmentsToText(resolveFriendNotificationSegments(message))
}

// ==================== RTC 通话事件 ====================

// RTC_CALL_START payload；仅群聊；用于聊天 tip 文案「{inviter} 发起了{voice/video}通话」
export type RtcCallStartPayload = {
  room?: string
  conversationType?: number
  mediaType?: number
  inviterUserId?: number
  inviterNickname?: string
  inviterAvatar?: string
}

// RTC_CALL_END payload；私聊准气泡 + 群聊「通话已结束 [时长 X]」共用
export type RtcCallEndPayload = {
  room?: string
  conversationType?: number
  mediaType?: number
  endReason?: number
  durationSeconds?: number
  operatorUserId?: number
  operatorNickname?: string
  operatorAvatar?: string
}

/** 解析 RTC_CALL_START / RTC_CALL_END 消息 content；解析失败返回 null */
export function parseRtcCallPayload(
  content?: string
): (RtcCallStartPayload & RtcCallEndPayload) | null {
  return content ? parseMessage<RtcCallStartPayload & RtcCallEndPayload>(content) : null
}

/**
 * 会话内通话事件 segments（RTC_CALL_START / RTC_CALL_END）
 * <p>
 * 群聊两段式：START「{inviter} 发起了语音通话」+ END「语音通话已经结束」
 * <p>
 * 私聊气泡走 {@link resolveRtcCallPrivateBubbleText}
 */
export function resolveRtcCallTipSegments(message: {
  type?: number
  content?: string
  selfSend?: boolean
}): TipSegment[] {
  const payload = parseRtcCallPayload(message.content)
  if (!payload) {
    return []
  }
  if (message.type === ImContentType.RTC_CALL_START) {
    return payload.inviterUserId
      ? [
          tipMention(payload.inviterUserId, resolveRtcInviterLabel(payload)),
          tipText(' 发起了语音通话')
        ]
      : []
  }
  if (message.type === ImContentType.RTC_CALL_END) {
    return [tipText('语音通话已经结束')]
  }
  return []
}

/** 取 RTC 通话发起人展示名；昵称为空时回退「用户 {id}」 */
function resolveRtcInviterLabel(payload: RtcCallStartPayload): string {
  return payload.inviterNickname?.trim() || `用户 ${payload.inviterUserId ?? ''}`
}

/**
 * 会话列表最后一条预览文案（RTC_CALL_START / RTC_CALL_END）
 * <p>
 * 私聊：START / END 都展示「[语音通话]」，对齐 [图片] / [语音] 风格
 * <p>
 * 群聊：START「{inviter} 发起了语音通话」、END「语音通话已经结束」，与聊天 tip 同源
 */
export function resolveRtcCallLastContent(
  message: { type?: number; content?: string },
  conversationType: number
): string {
  if (conversationType === ImConversationType.PRIVATE) {
    return '[语音通话]'
  }
  if (message.type === ImContentType.RTC_CALL_END) {
    return '语音通话已经结束'
  }
  if (message.type === ImContentType.RTC_CALL_START) {
    const payload = parseRtcCallPayload(message.content)
    if (payload) {
      return `${resolveRtcInviterLabel(payload)} 发起了语音通话`
    }
  }
  return ''
}

/**
 * 私聊 RTC_CALL_END 气泡内文案；按 operatorUserId 是不是自己渲染两端不同文案（对齐微信）
 * <p>
 * 文案规则：
 *   HANGUP duration > 0 → 「通话时长 N」（双方一致）
 *   HANGUP duration ≤ 0 → 「通话中断」（未接通的兜底）
 *   CANCEL → 操作者「已取消」/ 另一方「对方已取消」
 *   REJECT → 操作者「已拒绝」/ 另一方「对方已拒绝」
 *   BUSY → 操作者「忙线未接听」/ 另一方「对方忙线中」
 *   NO_ANSWER → 操作者「未接听」/ 另一方「对方未接听」（振铃超时 Job 触发）
 *   ERROR → 「通话中断 [N]」（接通后异常断开；duration > 0 时带时长）
 */
export function resolveRtcCallPrivateBubbleText(payload: RtcCallEndPayload | null): string {
  if (!payload) {
    return '通话已结束'
  }
  const duration = payload.durationSeconds ?? 0
  const hasDuration = duration > 0
  const isOperator = payload.operatorUserId === getCurrentUserId()
  switch (payload.endReason) {
    case ImRtcCallEndReason.HANGUP:
      return hasDuration ? `通话时长 ${formatCallDuration(duration)}` : '通话中断'
    case ImRtcCallEndReason.CANCEL:
      return isOperator ? '已取消' : '对方已取消'
    case ImRtcCallEndReason.REJECT:
      return isOperator ? '已拒绝' : '对方已拒绝'
    case ImRtcCallEndReason.NO_ANSWER:
      return isOperator ? '未接听' : '对方未接听'
    case ImRtcCallEndReason.BUSY:
      return isOperator ? '忙线未接听' : '对方忙线中'
    case ImRtcCallEndReason.ERROR:
      return hasDuration ? `通话中断 ${formatCallDuration(duration)}` : '通话中断'
    default:
      return hasDuration ? `通话时长 ${formatCallDuration(duration)}` : '通话已结束'
  }
}

/** 会话内通话事件文案 */
export function resolveRtcCallTipText(message: {
  type?: number
  content?: string
  selfSend?: boolean
}): string {
  return segmentsToText(resolveRtcCallTipSegments(message))
}

/**
 * RTC_CALL_END 结束原因兜底文案；前端 toast / console 兜底用
 * <p>
 * 缺 operator 信息（同步响应 + WS push 兜底场景）时的通用文案；细分文案（按发送方视角）走 {@link resolveRtcCallPrivateBubbleText}
 */
export function resolveCallEndReasonText(reason: number | undefined): string {
  switch (reason) {
    case ImRtcCallEndReason.REJECT:
      return '对方已拒绝'
    case ImRtcCallEndReason.CANCEL:
      return '对方已取消'
    case ImRtcCallEndReason.BUSY:
      return '对方忙线中'
    case ImRtcCallEndReason.HANGUP:
      return '通话已结束'
    case ImRtcCallEndReason.ERROR:
      return '通话异常'
    default:
      return '通话已断开'
  }
}
