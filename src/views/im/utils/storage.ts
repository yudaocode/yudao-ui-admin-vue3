import localforage from 'localforage'

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
 * - 会话相关（meta / message）走 imStorage（IndexedDB），key 形如 `conversation:xxx:{userId}:...`
 * - 轻量 UI 状态（侧边栏宽度）仍走 localStorage：体积小、跨 Tab 同步天然，没必要走 IndexedDB
 *
 * 所有会话相关 key 都注入 userId：多账号切换时按用户隔离，避免数据互串。
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
  conversationMessage: (userId: number | string, type: number, targetId: number) =>
    `conversation:message:${userId}:${type}:${targetId}`,

  /** 侧边栏宽度（localStorage）；page 区分消息 / 好友 / 群三个 Tab，独立记忆。 */
  asideWidth: (page: 'message' | 'friend' | 'group') => `im:aside:${page}`
} as const
