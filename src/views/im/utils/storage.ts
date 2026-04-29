import localforage from 'localforage'
import { toRaw } from 'vue'

import { CACHE_KEY, useCache } from '@/hooks/web/useCache'

/**
 * IM 模块的 IndexedDB 实例（localforage 优先 IndexedDB，自动降级到 WebSQL / localStorage）
 *
 * 为什么不用 localStorage 直接存：
 * 1. 配额：localStorage 整体上限 5~10MB，多会话长历史很容易撑爆
 * 2. 写放大：localStorage 必须按 key 整体写入，单次写就是 MB 级序列化阻塞主线程
 *
 * 配套策略：会话与消息按 key 分桶（见 StorageKeys），让单次变更只重写最小粒度的 key。
 * IndexedDB 默认配额一般是浏览器可用空间的 ~50%，远大于 localStorage，配合分桶才发挥效果。
 */
export const imStorage = localforage.createInstance({
  name: 'im',
  storeName: 'conversation',
  description: 'IM 会话索引与消息缓存'
})

/**
 * 存储 key 统一在此生成
 *
 * - 会话 / 好友 / 群相关业务数据走 imStorage（IndexedDB），key 都按 userId 分桶
 * - 轻量 UI 状态（侧边栏宽度）仍走 localStorage：体积小、跨 Tab 同步天然，没必要走 IndexedDB
 *
 * 所有业务 key 都注入 userId：多账号切换按用户隔离，避免数据互串；账号切换时只清 in-memory，
 * IDB 数据保留——回切旧账号能秒开，不浪费已下载好友 / 群 / 成员快照
 */
export const StorageKeys = {
  /**
   * 会话索引：游标 + 会话元数据（不含 messages），对应 ConversationStoreMeta
   *
   * 任何会话级元数据变更（top / muted / unread / 列表增删 / 排序）都会重写这一个 key；
   * 由于 messages 已剥离到独立 key，单次写体积稳定（仅元数据，量级 KB 级）。
   */
  conversationMeta: (userId: number | string) => `conversation:meta:${userId}`,
  /**
   * 单会话消息：按 (type, targetId) 分桶，存 Message[]
   *
   * - type：私聊 / 群聊（对齐 ImConversationType）
   * - targetId：私聊的对方 userId / 群聊的 groupId
   *
   * 每条消息变更只重写当前会话这一个 key，避免老方案"全量写所有会话所有消息"的写放大。
   * 软删除会话时由 conversationStore.removeConversationMessages 物理删除该 key，避免 orphan 残留。
   */
  conversationMessages: (userId: number | string, type: number, targetId: number) =>
    `conversation:messages:${userId}:${type}:${targetId}`,

  /** 好友列表整桶（含 DISABLE 软删记录）；好友量级有限，不维护增量 */
  friends: (userId: number | string) => `friends:${userId}`,
  /** 群列表整桶（不含 members，剥离到独立 key），保证整桶写不带成员爆量 */
  groups: (userId: number | string) => `groups:${userId}`,
  /** 单群成员，按 groupId 分桶——单群可上百-千级，跟懒加载粒度对齐；群解散时物理删 */
  groupMembers: (userId: number | string, groupId: number) =>
    `groupMembers:${userId}:${groupId}`,

  /** 侧边栏宽度（localStorage）；三个 Tab 共用一份记忆，对齐微信（拖一次到处一致）。 */
  asideWidth: 'im:aside'
} as const

/** 取当前登录用户编号；返回 0 表示未登录，调用方一律早 return 不写无主 key */
export function getCurrentUserId(): number {
  const { wsCache } = useCache()
  const user = wsCache.get(CACHE_KEY.USER)?.user
  return Number(user?.id) || 0
}

/** IDB 写入：fire-and-forget */
// TODO @AI：setQuietly？会不会更好？
export function safeImSet(key: string, value: unknown, errorLabel: string): void {
  // toRaw 拆 Vue / Pinia reactive Proxy——structuredClone 不接 Proxy 会抛 DataCloneError 静默丢盘
  const raw = value && typeof value === 'object' ? toRaw(value) : value
  void imStorage.setItem(key, raw).catch((e) => console.warn(errorLabel, e))
}

// TODO @AI：removeQuietly？会不会更好？
export function safeImRemove(key: string, errorLabel: string): void {
  void imStorage.removeItem(key).catch((e) => console.warn(errorLabel, e))
}
