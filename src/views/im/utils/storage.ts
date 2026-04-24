// localStorage key 统一在此生成。im: 前缀避免与其他模块冲突。
// 当前数据量（会话 / 消息）直接用 localStorage 满足，不需要 IndexedDB。
export const StorageKeys = {
  conversations: (userId: number | string) => `im:conversations:${userId}`,
  asideWidth: (page: 'friend' | 'group') => `im:aside:${page}`
} as const
