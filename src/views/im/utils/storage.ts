import localforage from 'localforage'
import { toRaw } from 'vue'

import { CACHE_KEY, useCache } from '@/hooks/web/useCache'

/**
 * IM 模块本地缓存实例（localforage 优先 IndexedDB，自动降级到 WebSQL / localStorage）
 */
export const imStorage = localforage.createInstance({
  name: 'im',
  storeName: 'conversation',
  description: 'IM 本地缓存'
})

/**
 * 存储 key 统一在此生成
 *
 * - 好友 / 群相关业务数据走 imStorage（IndexedDB），key 都按 userId 分桶
 * - 轻量 UI 状态（侧边栏宽度）仍走 localStorage：体积小、跨 Tab 同步天然，没必要走 IndexedDB
 *
 * 所有业务 key 都注入 userId：多账号切换按用户隔离避免数据互串；账号切换时只清 in-memory、IDB 数据保留——回切旧账号能秒开，不浪费已下载好友 / 群 / 成员快照
 */
export const StorageKeys = {
  /** 好友列表整桶（含 DISABLE 软删记录）；好友量级有限，不维护增量 */
  friends: (userId: number | string) => `friends:${userId}`,
  /** 群列表整桶（不含 members，剥离到独立 key），保证整桶写不带成员爆量 */
  groups: (userId: number | string) => `groups:${userId}`,
  /** 频道列表整桶；频道量级很小，整桶整写够用 */
  channels: (userId: number | string) => `channels:${userId}`,
  /** 单群成员，按 groupId 分桶——单群可上百-千级，跟懒加载粒度对齐；群解散时物理删 */
  groupMembers: (userId: number | string, groupId: number) => `groupMembers:${userId}:${groupId}`,

  /** 侧边栏宽度（localStorage）；三个 Tab 共用一份记忆，对齐微信（拖一次到处一致）。 */
  asideWidth: 'im:aside',
  /** 会话列表置顶折叠展开态（localStorage）；轻量 UI 偏好。 */
  conversationPinnedExpanded: 'im:conversation:pinnedExpanded'
} as const

/** 取当前登录用户编号；返回 0 表示未登录，调用方一律早 return 不写无主 key */
export function getCurrentUserId(): number {
  const { wsCache } = useCache()
  const user = wsCache.get(CACHE_KEY.USER)?.user
  return Number(user?.id) || 0
}

/** IDB 写入：fire-and-forget */
export function setQuietly(key: string, value: unknown, errorLabel: string): void {
  const raw = toStorageValue(value)
  void imStorage.setItem(key, raw).catch((e) => console.warn(errorLabel, e))
}

export function removeQuietly(key: string, errorLabel: string): void {
  void imStorage.removeItem(key).catch((e) => console.warn(errorLabel, e))
}

/** 转换为 IndexedDB 可存储的数据 */
function toStorageValue<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  const raw = value && typeof value === 'object' ? toRaw(value) : value
  if (!raw || typeof raw !== 'object') {
    return raw
  }
  if (raw instanceof Date || raw instanceof Blob || raw instanceof ArrayBuffer) {
    return raw
  }
  if (seen.has(raw)) {
    return seen.get(raw) as T
  }
  if (Array.isArray(raw)) {
    const array: unknown[] = []
    seen.set(raw, array)
    raw.forEach((item) => array.push(toStorageValue(item, seen)))
    return array as T
  }
  const out: Record<string, unknown> = {}
  seen.set(raw, out)
  Object.entries(raw).forEach(([key, item]) => {
    if (typeof item === 'function' || typeof item === 'symbol') {
      return
    }
    out[key] = toStorageValue(item, seen)
  })
  return out as T
}
