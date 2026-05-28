import { toRaw } from 'vue'

import { getCurrentUserId } from '@/utils/auth'
import { ImConversationType } from './constants'
import type { MessageDO, SettingDO } from '../home/types'

export const DB_SCHEMA_VERSION = 1

export type DbStoreName =
  | 'conversations'
  | 'messages'
  | 'friends'
  | 'friendRequests'
  | 'groups'
  | 'groupMembers'
  | 'groupRequests'
  | 'channels'
  | 'settings'

export type DbTransaction = IDBTransaction

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
    recentForwardConversationKeys: 'recentForwardConversationKeys'
  }
} as const

let currentDb: IDBDatabase | null = null
let currentUserId: number | null = null
let currentSession = 0

/** 校验当前 IM IndexedDB session 仍有效 */
export function isCurrentDbSession(session: number): boolean {
  return session === currentSession
}

/** 获取当前 IM IndexedDB session */
export function getDbSession(): number {
  return currentSession
}

/** 拼接当前用户 IM DB 名称 */
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
export async function initDb(): Promise<void> {
  const userId = getCurrentUserId()
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error('当前用户不存在，无法初始化 IM DB')
  }
  if (currentDb && currentUserId === userId) {
    return
  }
  currentDb?.close()
  currentSession++
  currentUserId = userId
  currentDb = await openDb(getDbName(userId))
}

/** 关闭当前 IM DB 连接 */
function closeDbConnection() {
  currentDb?.close()
  currentDb = null
  currentUserId = null
}

/** 获取当前 IM DB */
function getRawDb(): IDBDatabase {
  if (!currentDb) {
    throw new Error('IM DB 未初始化')
  }
  return currentDb
}

/** 校验单次写入 session */
function guardSession(session: number) {
  if (!isCurrentDbSession(session)) {
    throw new Error('IM DB session 已失效')
  }
}

/** 克隆可入库对象 */
function toDbValue<T>(value: T): T {
  return toRaw(value) as T
}

class DbClient {
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
    return this.transaction<T[]>([storeName], 'readonly', (tx) =>
      this.getAll<T>(storeName, tx)
    )
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
    await this.transaction([storeName], 'readwrite', (tx) =>
      this.delete(storeName, key, tx)
    )
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
  async transaction<T>(
    storeNames: DbStoreName[],
    mode: IDBTransactionMode,
    runner: (tx: DbTransaction) => Promise<T>
  ): Promise<T> {
    // 开启事务前校验 session
    const session = getDbSession()
    guardSession(session)
    const tx = getRawDb().transaction(storeNames, mode)
    const done = transactionDone(tx)
    let result: T
    try {
      // 事务内只执行 IndexedDB request 链
      result = await runner(tx)
    } catch (e) {
      try {
        tx.abort()
      } catch {}
      await done.catch(() => undefined)
      throw e
    }
    // commit 后再次校验 session
    await done
    guardSession(session)
    return result
  }

  /** 按会话分页获取消息 */
  async getMessageListByConversation(
    clientConversationId: string,
    options?: { beforeSendTime?: number; limit?: number },
    tx?: DbTransaction
  ): Promise<MessageDO[]> {
    const limit = options?.limit ?? 50
    const upper = options?.beforeSendTime ?? Number.MAX_SAFE_INTEGER
    const range = IDBKeyRange.bound(
      [clientConversationId, 0],
      [clientConversationId, upper],
      false,
      true
    )
    const read = async (tx: DbTransaction): Promise<MessageDO[]> => {
      const index = tx.objectStore('messages').index('clientConversationId+sendTime')
      const out: MessageDO[] = []
      await new Promise<void>((resolve, reject) => {
        // 从新到旧读取一页
        const request = index.openCursor(range, 'prev')
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const cursor = request.result
          if (!cursor || out.length >= limit) {
            resolve()
            return
          }
          out.push(cursor.value as MessageDO)
          cursor.continue()
        }
      })
      // 气泡渲染需要按时间升序
      return out.reverse()
    }
    if (tx) {
      return read(tx)
    }
    return this.transaction<MessageDO[]>(['messages'], 'readonly', read)
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

const dbClient = new DbClient()

/** 获取当前 IM DB client */
export function getDb(): DbClient {
  return dbClient
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
  const targetId = Number(targetIdText)
  if (!Number.isFinite(type) || !Number.isFinite(targetId) || targetId <= 0) {
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

/** 解析本地消息主键 */
export function parseMessageKey(
  messageKey: string
):
  | { kind: 'client'; clientMessageId: string }
  | { kind: 'server'; conversationType: number; id: number }
  | null {
  if (!messageKey) {
    return null
  }
  if (messageKey.startsWith('client:')) {
    const clientMessageId = messageKey.slice('client:'.length)
    return clientMessageId ? { kind: 'client', clientMessageId } : null
  }
  const [conversationTypeText, idText] = messageKey.split(':')
  const conversationType = Number(conversationTypeText)
  const id = Number(idText)
  if (!Number.isFinite(conversationType) || !Number.isFinite(id) || id <= 0) {
    return null
  }
  return { kind: 'server', conversationType, id }
}

/** 更新消息拉取游标 */
export async function setMessageMaxId(
  conversationType: number,
  maxId: number | undefined,
  tx?: DbTransaction
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
  const db = getDb()
  const current = (await db.getSetting<number>(key, tx)) || 0
  if (maxId > current) {
    await db.setSetting(key, maxId, tx)
  }
}

/** 停止当前 IM DB session */
export async function stopRequests(): Promise<void> {
  currentSession++
  const [
    { useMessageStoreWithOut },
    { useConversationStoreWithOut },
    { useFriendStoreWithOut },
    { useGroupStoreWithOut },
    { useChannelStoreWithOut },
    { useGroupRequestStoreWithOut },
    { useFaceStoreWithOut }
  ] = await Promise.all([
    import('../home/store/messageStore'),
    import('../home/store/conversationStore'),
    import('../home/store/friendStore'),
    import('../home/store/groupStore'),
    import('../home/store/channelStore'),
    import('../home/store/groupRequestStore'),
    import('../home/store/faceStore')
  ])
  useMessageStoreWithOut().clear()
  useConversationStoreWithOut().clear()
  useFriendStoreWithOut().clear()
  useGroupStoreWithOut().clear()
  useChannelStoreWithOut().clear()
  useGroupRequestStoreWithOut().clear()
  useFaceStoreWithOut().clear()
  closeDbConnection()
}
