import { isPositiveId, parseId, compareId } from '@/utils/id'
import { toRaw } from 'vue'

import { getCurrentUserId } from '@/utils/auth'
import { ImConversationType } from './constants'
import type { MessageDO, SettingDO } from '../home/types'

export const DB_SCHEMA_VERSION = 2

export type DbStoreName =
  | 'conversations'
  | 'conversationReads'
  | 'messages'
  | 'friends'
  | 'friendRequests'
  | 'groups'
  | 'groupMembers'
  | 'groupRequests'
  | 'channels'
  | 'settings'

export type DbTransaction = IDBTransaction

/** 数据库消息分页游标 */
export interface MessageDOPageCursor {
  sendTime: number
  messageKey: string
}

/** 数据库消息分页结果 */
export interface MessageDOPageResult {
  list: MessageDO[]
  hasMore: boolean
}

/** IM 本地存储 key */
export const StorageKeys = {
  localStorage: {
    /** 侧边栏宽度，三个 Tab 共用一份记忆 */
    asideWidth: 'im:aside',
    /** 会话列表置顶折叠展开态 */
    conversationPinnedExpanded: 'im:conversation:pinnedExpanded'
  },
  settings: {
    /** 私聊消息拉取游标 */
    privateMessageMaxId: 'privateMessageMaxId',
    /** 群聊消息拉取游标 */
    groupMessageMaxId: 'groupMessageMaxId',
    /** 频道消息拉取游标 */
    channelMessageMaxId: 'channelMessageMaxId',
    /** 最近转发会话 key 列表 */
    recentForwardConversationKeys: 'recentForwardConversationKeys',
    // 状态事件补偿增量拉取游标：与上面消息 maxId 游标共用同一 settings keyspace，统一登记在此避免撞 key；
    // 走 update_time + id 复合游标（非单条 maxId），故用 PullCursor 后缀区分语义
    /** 好友关系增量拉取游标 */
    friendPullCursor: 'friendPullCursor',
    /** 好友申请增量拉取游标 */
    friendRequestPullCursor: 'friendRequestPullCursor',
    /** 加群申请增量拉取游标 */
    groupRequestPullCursor: 'groupRequestPullCursor',
    /** 会话读位置增量拉取游标 */
    conversationReadPullCursor: 'conversationReadPullCursor',
    /** 单会话清理边界 */
    conversationClearBeforePrefix: 'conversationClearBefore:',
    /** 单会话本地删除消息 key */
    conversationDeletedMessagesPrefix: 'conversationDeletedMessages:',
    /** 单会话已撤回消息 key */
    conversationRecalledMessagesPrefix: 'conversationRecalledMessages:'
  }
} as const

let currentClient: DbClient | null = null
let initialization:
  | {
      userId: number
      promise: Promise<DbClient>
    }
  | undefined

/** 拼接当前身份 IM DB 名称 */
function getDbName(userId: number): string {
  return `im:${userId}`
}

/** 包装 IndexedDB request */
function requestToPromise<T = unknown>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** 等待事务完成 */
function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

/** 创建索引 */
function createIndex(
  store: IDBObjectStore,
  name: string,
  keyPath: string | string[],
  options?: IDBIndexParameters
) {
  if (!store.indexNames.contains(name)) {
    store.createIndex(name, keyPath, options)
  }
}

/** 初始化 schema */
function upgradeSchema(db: IDBDatabase) {
  if (!db.objectStoreNames.contains('conversations')) {
    const store = db.createObjectStore('conversations', { keyPath: 'clientConversationId' })
    createIndex(store, 'lastSendTime', 'lastSendTime')
  }
  if (!db.objectStoreNames.contains('conversationReads')) {
    const store = db.createObjectStore('conversationReads', { keyPath: 'clientConversationId' })
    createIndex(store, 'conversationType+targetId', ['conversationType', 'targetId'], {
      unique: true
    })
  }
  if (!db.objectStoreNames.contains('messages')) {
    const store = db.createObjectStore('messages', { keyPath: 'messageKey' })
    createIndex(store, 'clientConversationId', 'clientConversationId')
    createIndex(store, 'clientConversationId+sendTime', ['clientConversationId', 'sendTime'])
    createIndex(store, 'clientMessageId', 'clientMessageId', { unique: true })
  }
  if (!db.objectStoreNames.contains('friends')) {
    const store = db.createObjectStore('friends', { keyPath: 'id' })
    createIndex(store, 'friendUserId', 'friendUserId', { unique: true })
    createIndex(store, 'status', 'status')
  }
  if (!db.objectStoreNames.contains('friendRequests')) {
    const store = db.createObjectStore('friendRequests', { keyPath: 'id' })
    createIndex(store, 'status', 'status')
    createIndex(store, 'createTime', 'createTime')
  }
  if (!db.objectStoreNames.contains('groups')) {
    const store = db.createObjectStore('groups', { keyPath: 'id' })
    createIndex(store, 'name', 'name')
    createIndex(store, 'status', 'status')
  }
  if (!db.objectStoreNames.contains('groupMembers')) {
    const store = db.createObjectStore('groupMembers', { keyPath: 'id' })
    createIndex(store, 'groupId', 'groupId')
    createIndex(store, 'groupId+userId', ['groupId', 'userId'], { unique: true })
  }
  if (!db.objectStoreNames.contains('groupRequests')) {
    const store = db.createObjectStore('groupRequests', { keyPath: 'id' })
    createIndex(store, 'status', 'status')
    createIndex(store, 'createTime', 'createTime')
  }
  if (!db.objectStoreNames.contains('channels')) {
    const store = db.createObjectStore('channels', { keyPath: 'id' })
    createIndex(store, 'status', 'status')
    createIndex(store, 'sort', 'sort')
  }
  if (!db.objectStoreNames.contains('settings')) {
    db.createObjectStore('settings', { keyPath: 'key' })
  }
}

/** 打开 IM IndexedDB */
function openDb(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, DB_SCHEMA_VERSION)
    // 创建或升级对象仓库
    request.onupgradeneeded = () => upgradeSchema(request.result)
    // 返回可复用连接
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** 初始化当前用户 IM DB */
export async function initDb(): Promise<DbClient> {
  const userId = getCurrentUserId()
  if (!isPositiveId(userId)) {
    throw new Error('当前用户不存在，无法初始化 IM DB')
  }
  if (currentClient?.userId === userId) {
    return currentClient
  }
  if (initialization?.userId === userId) {
    return initialization.promise
  }
  const promise = openDb(getDbName(userId)).then((nextDb) => {
    if (initialization?.promise !== promise || getCurrentUserId() !== userId) {
      nextDb.close()
      throw new Error('IM DB 初始化已失效')
    }
    const nextClient = new DbClient(nextDb, userId)
    currentClient?.close()
    currentClient = nextClient
    return nextClient
  })
  initialization = { userId, promise }
  try {
    return await promise
  } finally {
    if (initialization?.promise === promise) {
      initialization = undefined
    }
  }
}

/** 关闭当前 IM DB 连接 */
export function closeDb(): Promise<void> {
  initialization = undefined
  currentClient?.close()
  currentClient = null
  return Promise.resolve()
}

/** 克隆可入库对象 */
function toDbValue<T>(value: T): T {
  return cloneDbValue(value) as T
}

/** 转换为 IndexedDB 可克隆对象 */
function cloneDbValue(value: unknown): unknown {
  const raw = toRaw(value)
  if (Array.isArray(raw)) {
    return raw.map((item) => cloneDbValue(item))
  }
  if (!raw || typeof raw !== 'object') {
    return raw
  }
  const prototype = Object.getPrototypeOf(raw)
  if (prototype !== Object.prototype && prototype !== null) {
    return raw
  }
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([key, item]) => [key, cloneDbValue(item)])
  )
}

export class DbClient {
  constructor(
    private readonly db: IDBDatabase,
    readonly userId: number
  ) {}

  /** 关闭底层 IndexedDB 连接 */
  close(): void {
    this.db.close()
  }

  /** 获取单条记录 */
  async get<T>(
    storeName: DbStoreName,
    key: IDBValidKey,
    tx?: DbTransaction
  ): Promise<T | undefined> {
    if (tx) {
      return requestToPromise<T | undefined>(tx.objectStore(storeName).get(key))
    }
    return this.transaction<T | undefined>([storeName], 'readonly', (tx) =>
      this.get<T>(storeName, key, tx)
    )
  }

  /** 获取 store 全量记录 */
  async getAll<T>(storeName: DbStoreName, tx?: DbTransaction): Promise<T[]> {
    if (tx) {
      return requestToPromise<T[]>(tx.objectStore(storeName).getAll())
    }
    return this.transaction<T[]>([storeName], 'readonly', (tx) => this.getAll<T>(storeName, tx))
  }

  /** 按唯一索引获取单条记录 */
  async getByIndex<T>(
    storeName: DbStoreName,
    indexName: string,
    query: IDBValidKey | IDBKeyRange,
    tx?: DbTransaction
  ): Promise<T | undefined> {
    if (tx) {
      return requestToPromise<T | undefined>(tx.objectStore(storeName).index(indexName).get(query))
    }
    return this.transaction<T | undefined>([storeName], 'readonly', (tx) =>
      this.getByIndex<T>(storeName, indexName, query, tx)
    )
  }

  /** 按索引获取记录列表 */
  async getAllByIndex<T>(
    storeName: DbStoreName,
    indexName: string,
    query?: IDBValidKey | IDBKeyRange,
    tx?: DbTransaction
  ): Promise<T[]> {
    if (tx) {
      return requestToPromise<T[]>(tx.objectStore(storeName).index(indexName).getAll(query))
    }
    return this.transaction<T[]>([storeName], 'readonly', (tx) =>
      this.getAllByIndex<T>(storeName, indexName, query, tx)
    )
  }

  /** 写入记录 */
  async put<T>(storeName: DbStoreName, value: T, tx?: DbTransaction): Promise<void> {
    if (tx) {
      await requestToPromise(tx.objectStore(storeName).put(toDbValue(value)))
      return
    }
    await this.transaction([storeName], 'readwrite', (tx) => this.put(storeName, value, tx))
  }

  /** 删除记录 */
  async delete(storeName: DbStoreName, key: IDBValidKey, tx?: DbTransaction): Promise<void> {
    if (tx) {
      await requestToPromise(tx.objectStore(storeName).delete(key))
      return
    }
    await this.transaction([storeName], 'readwrite', (tx) => this.delete(storeName, key, tx))
  }

  /** 清空 store 记录 */
  async clearStore(storeName: DbStoreName, tx?: DbTransaction): Promise<void> {
    if (tx) {
      await requestToPromise(tx.objectStore(storeName).clear())
      return
    }
    await this.transaction([storeName], 'readwrite', (tx) => this.clearStore(storeName, tx))
  }

  /** 按索引删除记录 */
  async deleteByIndex(
    storeName: DbStoreName,
    indexName: string,
    query: IDBValidKey | IDBKeyRange,
    tx?: DbTransaction
  ): Promise<void> {
    if (!tx) {
      await this.transaction([storeName], 'readwrite', (tx) =>
        this.deleteByIndex(storeName, indexName, query, tx)
      )
      return
    }
    const index = tx.objectStore(storeName).index(indexName)
    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(query)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor) {
          resolve()
          return
        }
        cursor.delete()
        cursor.continue()
      }
    })
  }

  /** 执行事务 */
  transaction<T>(
    storeNames: DbStoreName[],
    mode: IDBTransactionMode,
    runner: (tx: DbTransaction) => Promise<T>
  ): Promise<T> {
    return (async () => {
      const tx = this.db.transaction(storeNames, mode)
      const done = transactionDone(tx)
      let result: T
      try {
        result = await runner(tx)
      } catch (e) {
        try {
          tx.abort()
        } catch {}
        await done.catch(() => undefined)
        throw e
      }
      await done
      return result
    })()
  }

  /** 按会话分页获取消息 */
  async getMessageListByConversation(
    clientConversationId: string,
    options?: { before?: MessageDOPageCursor; limit?: number },
    tx?: DbTransaction
  ): Promise<MessageDOPageResult> {
    const limit = options?.limit ?? 50
    const before = options?.before
    const upper = before?.sendTime ?? Number.MAX_SAFE_INTEGER
    const range = IDBKeyRange.bound(
      [clientConversationId, 0],
      [clientConversationId, upper],
      false,
      !before
    )
    const read = async (tx: DbTransaction): Promise<MessageDOPageResult> => {
      const index = tx.objectStore('messages').index('clientConversationId+sendTime')
      const out: MessageDO[] = []
      await new Promise<void>((resolve, reject) => {
        // 从新到旧读取一页
        const request = index.openCursor(range, 'prev')
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const cursor = request.result
          if (!cursor) {
            resolve()
            return
          }
          const message = cursor.value as MessageDO
          if (
            before &&
            message.sendTime === before.sendTime &&
            message.messageKey >= before.messageKey
          ) {
            cursor.continue()
            return
          }
          out.push(message)
          if (out.length > limit) {
            resolve()
            return
          }
          cursor.continue()
        }
      })
      // 气泡渲染需要按时间升序
      return {
        list: out.slice(0, limit).reverse(),
        hasMore: out.length > limit
      }
    }
    if (tx) {
      return read(tx)
    }
    return this.transaction<MessageDOPageResult>(['messages'], 'readonly', read)
  }

  /** 读取设置 */
  async getSetting<T>(key: string, tx?: DbTransaction): Promise<T | undefined> {
    const item = await this.get<SettingDO<T>>('settings', key, tx)
    return item?.value
  }

  /** 写入设置 */
  async setSetting<T>(key: string, value: T, tx?: DbTransaction): Promise<void> {
    await this.put<SettingDO<T>>('settings', { key, value, updateTime: Date.now() }, tx)
  }
}

/** 获取当前用户 IM DB client */
export function getDb(): DbClient {
  if (!currentClient || currentClient.userId !== getCurrentUserId()) {
    throw new Error('IM DB 未初始化，请先调用 initDb()')
  }
  return currentClient
}

/** 当前用户会话主键 */
export function getClientConversationId(type: number, targetId: number): string {
  return `${type}:${targetId}`
}

/** 解析当前用户会话主键 */
export function parseClientConversationId(
  clientConversationId: string
): { type: number; targetId: number } | null {
  const [typeText, targetIdText] = clientConversationId.split(':')
  const type = Number(typeText)
  const targetId = parseId(targetIdText)
  if (!Number.isFinite(type) || !isPositiveId(targetId)) {
    return null
  }
  return { type, targetId }
}

/** 服务端消息主键 */
export function getServerMessageKey(conversationType: number, id: number): string {
  return `${conversationType}:${id}`
}

/** 客户端临时消息主键 */
export function getClientMessageKey(clientMessageId: string): string {
  return `client:${clientMessageId}`
}

/** 更新消息拉取游标 */
export async function setMessageMaxId(
  conversationType: number,
  maxId: number | undefined,
  tx?: DbTransaction,
  db: DbClient = getDb()
): Promise<void> {
  if (!maxId) {
    return
  }
  let key: string
  switch (conversationType) {
    case ImConversationType.PRIVATE:
      key = StorageKeys.settings.privateMessageMaxId
      break
    case ImConversationType.GROUP:
      key = StorageKeys.settings.groupMessageMaxId
      break
    case ImConversationType.CHANNEL:
      key = StorageKeys.settings.channelMessageMaxId
      break
    default:
      throw new Error(`未知 IM 会话类型：${conversationType}`)
  }
  const updateMaxId = async (transaction: DbTransaction) => {
    const current = (await db.getSetting<number>(key, transaction)) || 0
    if (compareId(maxId, current) > 0) {
      await db.setSetting(key, maxId, transaction)
    }
  }
  if (tx) {
    await updateMaxId(tx)
    return
  }
  await db.transaction(['settings'], 'readwrite', updateMaxId)
}
