import { compareId } from '@/utils/id'
import { maxImId } from '@/views/im/utils/pull'
import { acceptHMRUpdate, defineStore } from 'pinia'

import {
  IM_AT_ALL_USER_ID,
  ImConversationType,
  ImMessageReceiptStatus,
  ImMessageStatus,
  ImContentType,
  isGroupNotification,
  isNormalMessage
} from '../../utils/constants'
import {
  getClientConversationId,
  getClientMessageKey,
  getDb,
  getServerMessageKey,
  parseClientConversationId,
  setMessageMaxId,
  StorageKeys,
  type DbClient,
  type DbTransaction,
  type MessageDOPageCursor
} from '../../utils/db'
import {
  generateClientMessageId,
  parseMessage,
  parseRecallMessageId,
  revokeBlobUrlsInContent,
  serializeMessage
} from '../../utils/message'
import { resolveConversationLastContent } from '../../utils/conversation'
import { isGroupQuit, tryGetSenderDisplayName } from '../../utils/user'
import {
  enqueueConversationWrite,
  enqueueConversationWrites,
  isRelationTerminated,
  MessageTerminalPriority,
  reduceMessageState
} from '../../utils/messageSync'
import { useGroupStore } from './groupStore'
import { useConversationStore } from './conversationStore'
import type { Conversation, ConversationDO, Message, MessageDO } from '../types'

const MESSAGE_CACHE_RECENT_CONVERSATION_LIMIT = 5
const MESSAGE_CACHE_RETAIN_CONVERSATION_LIMIT = MESSAGE_CACHE_RECENT_CONVERSATION_LIMIT + 1
const ackMergingPromises = new Map<string, Promise<void>>()

interface MessageConversationInfo {
  type: number
  targetId: number
  name: string
  avatar: string
  silent?: boolean
}

interface PersistMessageRecordOptions {
  mergeClientRecord?: boolean
}

interface MessagePageResult {
  messages: Message[]
  hasMore: boolean
}

interface ConversationMessageTerminal {
  clearBefore: number
  deletedKeys: Set<string>
  recalledKeys: Set<string>
}

interface RecallMessageProjection {
  conversation: Conversation
  message: Message
  cachedMessage?: Message
}

/** 拉取消息批量处理项 */
export type PulledMessage =
  | {
      kind: 'insert'
      conversationInfo: MessageConversationInfo
      message: Message
    }
  | {
      kind: 'recall'
      conversationType: number
      targetId: number
      recallSignalContent: string
    }

/** 生成消息本地主键 */
function getMessageKey(
  message: Pick<Message, 'id' | 'clientMessageId'>,
  conversationType: number
): string {
  return message.id
    ? getServerMessageKey(conversationType, message.id)
    : getClientMessageKey(message.clientMessageId)
}

/** 判断消息是否已被当前设备清理或删除 */
function isMessageTerminated(message: Message, terminal: ConversationMessageTerminal): boolean {
  return (
    (!!message.id && compareId(message.id, terminal.clearBefore) <= 0) ||
    (!!message.id && terminal.deletedKeys.has(`id:${message.id}`)) ||
    terminal.deletedKeys.has(`client:${message.clientMessageId}`)
  )
}

/** 把已持久化的撤回 marker 应用到迟到的普通消息 */
function applyPersistedRecall(message: Message, terminal: ConversationMessageTerminal): Message {
  if (!message.id || !terminal.recalledKeys.has(`id:${message.id}`)) {
    return message
  }
  return {
    ...message,
    type: ImContentType.RECALL,
    content: '',
    status: ImMessageStatus.RECALL
  }
}

/** 读取会话持久化终态 */
async function getConversationMessageTerminal(
  clientConversationId: string,
  db: DbClient
): Promise<ConversationMessageTerminal> {
  const [clearBefore, deletedKeys, recalledKeys] = await Promise.all([
    db.getSetting<number>(
      `${StorageKeys.settings.conversationClearBeforePrefix}${clientConversationId}`
    ),
    db.getSetting<string[]>(
      `${StorageKeys.settings.conversationDeletedMessagesPrefix}${clientConversationId}`
    ),
    db.getSetting<string[]>(
      `${StorageKeys.settings.conversationRecalledMessagesPrefix}${clientConversationId}`
    )
  ])
  return {
    clearBefore: clearBefore || 0,
    deletedKeys: new Set(deletedKeys || []),
    recalledKeys: new Set(recalledKeys || [])
  }
}

/** 获取普通消息与撤回终态的归约优先级 */
function getMessageTerminalPriority(message: Pick<Message, 'id' | 'status' | 'type'>) {
  if (message.type === ImContentType.RECALL || message.status === ImMessageStatus.RECALL) {
    return MessageTerminalPriority.RECALL
  }
  return message.status === ImMessageStatus.NORMAL && !!message.id
    ? MessageTerminalPriority.CONFIRMED
    : MessageTerminalPriority.NORMAL
}

/** 获取数据库分页结果的最早游标 */
function getMessageDOPageCursor(message?: MessageDO): MessageDOPageCursor | undefined {
  return message
    ? {
        sendTime: message.sendTime,
        messageKey: message.messageKey
      }
    : undefined
}

/** 判断两个消息分页游标是否一致 */
function isSameMessageDOPageCursor(
  left?: MessageDOPageCursor,
  right?: MessageDOPageCursor
): boolean {
  if (!left || !right) {
    return left === right
  }
  return left.sendTime === right.sendTime && left.messageKey === right.messageKey
}

/** 补齐客户端消息编号 */
function ensureClientMessageId(message: Message): Message {
  if (!message.clientMessageId) {
    message.clientMessageId = generateClientMessageId()
  }
  if (!message.id) {
    message.id = undefined
  }
  return message
}

/** 媒体占位只持久化恢复标记，不把本次运行的 blob URL 写成可重发内容 */
function getPersistentMessageContent(message: Message): string {
  if (message.status !== ImMessageStatus.SENDING || !message._localFile) {
    return message.content
  }
  const payload = parseMessage<Record<string, unknown>>(message.content)
  if (!payload) {
    return message.content
  }
  const { url: _localUrl, coverUrl: _localCoverUrl, ...persistedPayload } = payload
  return serializeMessage({ ...persistedPayload, _uploadPending: true })
}

/** 将重启前未完成的本地消息降级为可识别的失败态 */
function recoverPendingMessage(message: MessageDO): MessageDO {
  if (message.status !== ImMessageStatus.SENDING) {
    return message
  }
  const payload = parseMessage<Record<string, unknown>>(message.content)
  if (!payload?._uploadPending) {
    return { ...message, status: ImMessageStatus.FAILED }
  }
  return {
    ...message,
    content: serializeMessage({ ...payload, _uploadPending: false, _uploadFailed: true }),
    status: ImMessageStatus.FAILED
  }
}

/** 转换为 IndexedDB 消息记录 */
function buildMessageDO(message: Message, conversationType: number): MessageDO {
  return {
    id: message.id,
    clientMessageId: message.clientMessageId,
    type: message.type,
    content: getPersistentMessageContent(message),
    status: message.status,
    sendTime: message.sendTime,
    senderId: message.senderId,
    atUserIds: message.atUserIds ? [...message.atUserIds] : undefined,
    receiverUserIds: message.receiverUserIds ? [...message.receiverUserIds] : undefined,
    receiptStatus: message.receiptStatus,
    readCount: message.readCount,
    materialId: message.materialId,
    targetId: message.targetId,
    selfSend: message.selfSend,
    messageKey: getMessageKey(message, conversationType),
    conversationType,
    clientConversationId: getClientConversationId(conversationType, message.targetId)
  }
}

/** IndexedDB 消息记录转前端消息 */
function buildMessageFromDO(message: MessageDO): Message {
  const {
    messageKey: _messageKey,
    conversationType: _conversationType,
    clientConversationId: _clientConversationId,
    ...rest
  } = message
  return rest
}

/** IndexedDB 会话记录转前端会话 */
function buildConversationFromDO(conversation: ConversationDO): Conversation {
  const { clientConversationId: _clientConversationId, ...rest } = conversation
  return rest
}

/** 算出末条消息的发送人快照 */
function deriveLastSenderDisplayName(
  conversation: Conversation,
  senderId: number,
  db: DbClient
): string | undefined {
  // 1. 优先使用当前内存中的好友 / 群成员信息
  const liveSenderName = tryGetSenderDisplayName(senderId, conversation.type, conversation.targetId)
  if (liveSenderName) {
    return liveSenderName
  }
  // 2. 群成员缓存缺失时异步补齐
  if (conversation.type === ImConversationType.GROUP) {
    const groupStore = useGroupStore()
    const group = groupStore.getGroup(conversation.targetId)
    if (!group || isGroupQuit(group)) {
      return conversation.lastSenderId === senderId ? conversation.lastSenderDisplayName : undefined
    }
    const fetchPromise =
      group?.membersLoaded && !group.membersExpired
        ? groupStore.fetchGroupMember(conversation.targetId, senderId)
        : groupStore.fetchGroupMemberList(conversation.targetId, false, db)
    fetchPromise.catch((e) =>
      console.warn(
        '[IM messageStore] 兜底拉群成员失败',
        { groupId: conversation.targetId, senderId, fullFetch: !group?.membersLoaded },
        e
      )
    )
  }
  return conversation.lastSenderId === senderId ? conversation.lastSenderDisplayName : undefined
}

/** 按消息更新会话摘要 */
function applyConversationSummary(
  conversation: Conversation,
  message: Message,
  db: DbClient
): void {
  const senderDisplayName = deriveLastSenderDisplayName(conversation, message.senderId, db)
  conversation.lastContent = resolveConversationLastContent(
    message,
    conversation.type,
    conversation.targetId,
    senderDisplayName
  )
  conversation.lastSendTime = message.sendTime || Date.now()
  conversation.lastSenderId = message.senderId
  conversation.lastMessageType = message.type
  conversation.lastMessageId = message.id
  conversation.lastClientMessageId = message.clientMessageId
  conversation.lastMessageStatus = message.status
  conversation.lastReceiptStatus = message.receiptStatus
  conversation.lastSelfSend = message.selfSend
  conversation.lastSenderDisplayName = senderDisplayName
}

/** 判断消息是否可以推进当前会话摘要 */
function shouldUpdateConversationSummary(conversation: Conversation, message: Message): boolean {
  if (message.id !== undefined && conversation.lastMessageId !== undefined) {
    return compareId(message.id, conversation.lastMessageId) >= 0
  }
  return (
    (!!message.clientMessageId && message.clientMessageId === conversation.lastClientMessageId) ||
    (message.sendTime || 0) > (conversation.lastSendTime || 0)
  )
}

/** 会话摘要顺序：服务端消息按 id，混合本地消息时按发送时间 */
function compareConversationSummaryOrder(
  left: Pick<Message, 'id' | 'clientMessageId' | 'sendTime'>,
  right: Pick<Message, 'id' | 'clientMessageId' | 'sendTime'>
): number {
  if (left.id && right.id) {
    return compareId(left.id, right.id)
  }
  return (
    (left.sendTime || 0) - (right.sendTime || 0) ||
    Number(!!left.id) - Number(!!right.id) ||
    left.clientMessageId.localeCompare(right.clientMessageId)
  )
}

/** 按末条消息重算会话摘要 */
function recomputeConversationLast(
  conversation: Conversation,
  messages: Message[],
  db: DbClient
): void {
  const last = messages[messages.length - 1]
  if (last) {
    applyConversationSummary(conversation, last, db)
    return
  }
  conversation.lastContent = ''
  conversation.lastSendTime = 0
  conversation.lastSenderId = undefined
  conversation.lastMessageType = undefined
  conversation.lastMessageId = undefined
  conversation.lastClientMessageId = undefined
  conversation.lastMessageStatus = undefined
  conversation.lastReceiptStatus = undefined
  conversation.lastSelfSend = undefined
  conversation.lastSenderDisplayName = undefined
}

/** 同步群 @ 状态 */
function syncConversationAtFlags(
  conversation: Conversation,
  message: Message,
  userId: number
): void {
  if (
    message.selfSend ||
    conversation.type !== ImConversationType.GROUP ||
    !message.atUserIds ||
    message.atUserIds.length === 0
  ) {
    return
  }
  if (message.atUserIds.includes(userId)) {
    conversation.atMe = true
    if (message.id && compareId(message.id, conversation.atMessageId || 0) > 0) {
      conversation.atMessageId = message.id
    }
  }
  if (message.atUserIds.includes(IM_AT_ALL_USER_ID)) {
    conversation.atAll = true
    if (message.id && compareId(message.id, conversation.atAllMessageId || 0) > 0) {
      conversation.atAllMessageId = message.id
    }
  }
}

/** 构建服务端消息更新后的下一份投影 */
function buildServerMessageProjection(message: Message, updates: Partial<Message>): Message {
  const next = { ...message, ...updates }
  if (message.receiptStatus !== undefined) {
    next.receiptStatus =
      updates.receiptStatus === undefined
        ? message.receiptStatus
        : Math.max(message.receiptStatus, updates.receiptStatus)
  }
  if (message.readCount !== undefined) {
    next.readCount =
      updates.readCount === undefined
        ? message.readCount
        : Math.max(message.readCount, updates.readCount)
  }
  if (updates.id === 0) {
    next.id = undefined
  }
  if (updates.status !== undefined && updates.status !== ImMessageStatus.SENDING) {
    next.uploadProgress = undefined
    if (updates.status !== ImMessageStatus.FAILED) {
      next._localFile = undefined
    }
  }
  return next
}

/** 发布已成功持久化的服务端消息更新 */
function applyServerMessageUpdate(message: Message, updates: Partial<Message>): void {
  if (updates.content && updates.content !== message.content) {
    revokeBlobUrlsInContent(message.content)
  }
  Object.assign(message, buildServerMessageProjection(message, updates))
}

/** 判断是否为同一条消息 */
function isSameMessage(left: Message, right: Message): boolean {
  if (left.id && right.id && left.id === right.id) {
    return true
  }
  return !!left.clientMessageId && left.clientMessageId === right.clientMessageId
}

export const useMessageStore = defineStore('imMessageStore', {
  state: () => ({
    messagesByConversation: {} as Record<string, Message[]>,
    messageDOPageCursors: {} as Record<string, MessageDOPageCursor | undefined>,
    loadedConversationKeys: [] as string[],
    recoveredConversationKeys: [] as string[],
    privateReadMaxIds: {} as Partial<Record<number, number>>,
    privateMessageMaxId: 0,
    groupMessageMaxId: 0,
    channelMessageMaxId: 0
  }),

  getters: {
    /** 获取会话已加载消息 */
    getMessages:
      (state) =>
      (clientConversationId: string): Message[] =>
        state.messagesByConversation[clientConversationId] || []
  },

  actions: {
    /** 清空消息内存 */
    clear() {
      Object.values(this.messagesByConversation).forEach((messages) => {
        messages.forEach((message) => {
          revokeBlobUrlsInContent(message.content)
          message._localFile = undefined
        })
      })
      this.messagesByConversation = {}
      this.messageDOPageCursors = {}
      this.loadedConversationKeys = []
      this.recoveredConversationKeys = []
      this.privateReadMaxIds = {}
      this.privateMessageMaxId = 0
      this.groupMessageMaxId = 0
      this.channelMessageMaxId = 0
      ackMergingPromises.clear()
    },

    /** 从 settings 加载消息游标 */
    async loadMessageCursorList() {
      const db = getDb()
      const [privateMaxId, groupMaxId, channelMaxId] = await Promise.all([
        db.getSetting<number>(StorageKeys.settings.privateMessageMaxId),
        db.getSetting<number>(StorageKeys.settings.groupMessageMaxId),
        db.getSetting<number>(StorageKeys.settings.channelMessageMaxId)
      ])
      this.privateMessageMaxId = privateMaxId || 0
      this.groupMessageMaxId = groupMaxId || 0
      this.channelMessageMaxId = channelMaxId || 0
    },

    /** 更新内存游标 */
    updateMessageCursor(conversationType: number, messageId?: number) {
      if (!messageId) {
        return
      }
      if (conversationType === ImConversationType.PRIVATE && compareId(messageId, this.privateMessageMaxId) > 0) {
        this.privateMessageMaxId = messageId
      } else if (
        conversationType === ImConversationType.GROUP &&
        compareId(messageId, this.groupMessageMaxId) > 0
      ) {
        this.groupMessageMaxId = messageId
      } else if (
        conversationType === ImConversationType.CHANNEL &&
        compareId(messageId, this.channelMessageMaxId) > 0
      ) {
        this.channelMessageMaxId = messageId
      }
    },

    /** 获取私聊对方已读位置缓存 */
    getPrivateReadMaxId(peerId: number): number | undefined {
      return this.privateReadMaxIds[peerId]
    },

    /** 更新私聊对方已读位置缓存 */
    updatePrivateReadMaxId(peerId: number, maxReadId?: number | null): number {
      if (!peerId) {
        return 0
      }
      const nextMaxReadId = maxReadId || 0
      const current = this.getPrivateReadMaxId(peerId)
      if (current !== undefined && compareId(nextMaxReadId, current) <= 0) {
        return current
      }
      this.privateReadMaxIds = { ...this.privateReadMaxIds, [peerId]: nextMaxReadId }
      return nextMaxReadId
    },

    /** 清空私聊对方已读位置缓存 */
    clearPrivateReadMaxIdCache(): void {
      this.privateReadMaxIds = {}
    },

    /** 标记会话近期使用 */
    touchConversationMessageCache(clientConversationId: string) {
      this.loadedConversationKeys = [
        clientConversationId,
        ...this.loadedConversationKeys.filter((key) => key !== clientConversationId)
      ]
      // 保留当前活跃会话 + 最近打开过的会话
      const retained = this.loadedConversationKeys.slice(0, MESSAGE_CACHE_RETAIN_CONVERSATION_LIMIT)
      const removed = this.loadedConversationKeys.slice(MESSAGE_CACHE_RETAIN_CONVERSATION_LIMIT)
      this.loadedConversationKeys = retained
      removed.forEach((key) => {
        delete this.messagesByConversation[key]
        delete this.messageDOPageCursors[key]
      })
    },

    /** 加载当前会话最近消息 */
    async loadMoreMessageList(
      clientConversationId: string,
      limit = 50,
      db: DbClient = getDb()
    ): Promise<MessagePageResult> {
      return enqueueConversationWrite(clientConversationId, () =>
        this.loadMoreMessageListNow(clientConversationId, limit, db)
      )
    },

    /** 实际加载会话消息；调用方必须持有当前会话写 lane */
    async loadMoreMessageListNow(
      clientConversationId: string,
      limit: number,
      db: DbClient
    ): Promise<MessagePageResult> {
      const parsed = parseClientConversationId(clientConversationId)
      if (!parsed) {
        return { messages: [], hasMore: false }
      }
      const before = this.messageDOPageCursors[clientConversationId]
      const terminal = await getConversationMessageTerminal(clientConversationId, db)
      if (!before && !this.recoveredConversationKeys.includes(clientConversationId)) {
        await this.recoverPendingMessageListNow(clientConversationId, terminal, db)
      }
      // 1. 从 IndexedDB 倒序读取一页，返回前已按时间升序排列
      const page = await db.getMessageListByConversation(clientConversationId, {
        before,
        limit
      })
      if (isSameMessageDOPageCursor(this.messageDOPageCursors[clientConversationId], before)) {
        const nextCursor = getMessageDOPageCursor(page.list[0])
        if (nextCursor) {
          this.messageDOPageCursors[clientConversationId] = nextCursor
        }
      }
      // 2. 合并到内存缓存，过滤已存在的消息
      const messages = page.list
        .map(buildMessageFromDO)
        .filter((message) => !isMessageTerminated(message, terminal))
        .map((message) => applyPersistedRecall(message, terminal))
      const existing = this.messagesByConversation[clientConversationId] || []
      const existingKeys = new Set(existing.map((message) => getMessageKey(message, parsed.type)))
      const fresh = messages.filter(
        (message) => !existingKeys.has(getMessageKey(message, parsed.type))
      )
      this.messagesByConversation[clientConversationId] = [...fresh, ...existing].sort(
        (messageA, messageB) => (messageA.sendTime || 0) - (messageB.sendTime || 0)
      )
      if (!before && !this.recoveredConversationKeys.includes(clientConversationId)) {
        this.recoveredConversationKeys.push(clientConversationId)
      }
      this.touchConversationMessageCache(clientConversationId)
      return { messages: fresh, hasMore: page.hasMore }
    },

    /** 恢复当前会话未完成消息；读取、去重和写回均处于同一写 lane */
    async recoverPendingMessageListNow(
      clientConversationId: string,
      terminal: ConversationMessageTerminal,
      db: DbClient
    ): Promise<void> {
      await db.transaction(['messages'], 'readwrite', async (tx) => {
        const records = await db.getAllByIndex<MessageDO>(
          'messages',
          'clientConversationId',
          clientConversationId,
          tx
        )
        const serverClientMessageIds = new Set(
          records.filter((message) => !!message.id).map((message) => message.clientMessageId)
        )
        for (const record of records) {
          const message = buildMessageFromDO(record)
          if (
            isMessageTerminated(message, terminal) ||
            (!record.id && serverClientMessageIds.has(record.clientMessageId))
          ) {
            await db.delete('messages', record.messageKey, tx)
            continue
          }
          const recovered = recoverPendingMessage(record)
          const recoveredMessage = buildMessageFromDO(recovered)
          const recalled = applyPersistedRecall(recoveredMessage, terminal)
          if (recovered !== record || recalled !== recoveredMessage) {
            await db.put('messages', buildMessageDO(recalled, record.conversationType), tx)
          }
        }
      })
    },

    /** 确保会话消息已加载 */
    async ensureConversationMessageListLoaded(conversation: Conversation) {
      const key = getClientConversationId(conversation.type, conversation.targetId)
      if (this.messagesByConversation[key] && this.recoveredConversationKeys.includes(key)) {
        this.touchConversationMessageCache(key)
        return
      }
      await this.loadMoreMessageList(key)
    },

    /** 获取内存消息数组 */
    getMessageList(conversationType: number, targetId: number): Message[] {
      const key = getClientConversationId(conversationType, targetId)
      if (!this.messagesByConversation[key]) {
        this.messagesByConversation[key] = []
      }
      this.touchConversationMessageCache(key)
      return this.messagesByConversation[key]
    },

    /** 持久化消息记录 */
    async saveMessageRecord(
      message: Message,
      conversationType: number,
      tx: DbTransaction | undefined,
      options: PersistMessageRecordOptions | undefined,
      db: DbClient
    ) {
      const next = buildMessageDO(message, conversationType)
      // 服务端 key 替换 client key
      if (options?.mergeClientRecord && message.id && message.clientMessageId) {
        const existing = await db.getByIndex<MessageDO>(
          'messages',
          'clientMessageId',
          message.clientMessageId,
          tx
        )
        if (existing && existing.messageKey !== next.messageKey) {
          await db.delete('messages', existing.messageKey, tx)
        }
      }
      await db.put('messages', next, tx)
    },

    /** 应用撤回到本地消息与会话状态 */
    async applyRecallMessageRecord(
      conversationType: number,
      targetId: number,
      recallSignalContent: string,
      tx: DbTransaction,
      staged: { conversation: Conversation; messages: Message[] } | undefined,
      db: DbClient
    ) {
      // 1. 定位被撤回的原消息和会话
      const messageId = parseRecallMessageId(recallSignalContent)
      if (!messageId) {
        return null
      }
      const clientConversationId = getClientConversationId(conversationType, targetId)
      const recallSettingKey = `${StorageKeys.settings.conversationRecalledMessagesPrefix}${clientConversationId}`
      const recalledKeys = (await db.getSetting<string[]>(recallSettingKey, tx)) || []
      await db.setSetting(
        recallSettingKey,
        Array.from(new Set([...recalledKeys, `id:${messageId}`])),
        tx
      )
      const conversationStore = useConversationStore()
      const currentConversation =
        staged?.conversation || conversationStore.getConversation(conversationType, targetId)
      if (!currentConversation) {
        return null
      }
      const cachedMessage = (
        staged?.messages || this.messagesByConversation[clientConversationId]
      )?.find((item) => item.id === messageId)
      const storedMessage = await db.get<MessageDO>(
        'messages',
        getServerMessageKey(conversationType, messageId),
        tx
      )
      const originalMessage = cachedMessage
        ? buildMessageDO(cachedMessage, conversationType)
        : storedMessage
      if (!originalMessage) {
        return null
      }
      // 2. 构建撤回后的消息和会话投影，再写数据库
      const recalledMessage = {
        ...(cachedMessage || buildMessageFromDO(originalMessage)),
        type: ImContentType.RECALL,
        status: ImMessageStatus.RECALL,
        content: ''
      }
      const conversation = { ...currentConversation }
      await this.saveMessageRecord(recalledMessage, conversationType, tx, undefined, db)
      // 3. 按本地完整消息和读位置重算未读与 @ 状态
      const storedMessages = await db.getAllByIndex<MessageDO>(
        'messages',
        'clientConversationId',
        clientConversationId,
        tx
      )
      conversationStore.applyRecallToConversation(
        conversation,
        storedMessages,
        originalMessage,
        db.userId
      )
      if (conversation.lastMessageId === messageId) {
        applyConversationSummary(conversation, recalledMessage, db)
      }
      return { conversation, message: recalledMessage, cachedMessage } as RecallMessageProjection
    },

    /** 把拉取批次投入涉及会话的串行写 lane */
    async applyPulledMessageList(
      pulledMessages: PulledMessage[],
      conversationType: number,
      maxMessageId: number | undefined,
      db: DbClient
    ) {
      const conversationIds = pulledMessages.map((item) =>
        item.kind === 'insert'
          ? getClientConversationId(item.conversationInfo.type, item.conversationInfo.targetId)
          : getClientConversationId(item.conversationType, item.targetId)
      )
      await enqueueConversationWrites(conversationIds, () =>
        this.applyPulledMessageListNow(pulledMessages, conversationType, maxMessageId, db)
      )
    },

    /** 批量写入拉取消息 */
    async applyPulledMessageListNow(
      pulledMessages: PulledMessage[],
      conversationType: number,
      maxMessageId: number | undefined,
      db: DbClient
    ) {
      if (pulledMessages.length === 0) {
        // 1. 空批次只推进游标
        await setMessageMaxId(conversationType, maxMessageId, undefined, db)
        this.updateMessageCursor(conversationType, maxMessageId)
        return
      }
      const conversationStore = useConversationStore()
      const groupStore = useGroupStore()
      const persistedMessages = new Map<
        string,
        { message: Message; conversationType: number; mergeClientRecord?: boolean }
      >()
      const changedConversations = new Map<string, Conversation>()
      const conversationProjections = new Map<
        string,
        {
          conversation: Conversation
          currentMessages: Message[]
          nextMessages: Message[]
        }
      >()
      const recallMessages: Extract<PulledMessage, { kind: 'recall' }>[] = []
      const terminalStates = new Map<string, ConversationMessageTerminal>()

      const getTerminal = async (clientConversationId: string) => {
        const cached = terminalStates.get(clientConversationId)
        if (cached) {
          return cached
        }
        const [clearBefore, deletedKeys, recalledKeys] = await Promise.all([
          db.getSetting<number>(
            `${StorageKeys.settings.conversationClearBeforePrefix}${clientConversationId}`
          ),
          db.getSetting<string[]>(
            `${StorageKeys.settings.conversationDeletedMessagesPrefix}${clientConversationId}`
          ),
          db.getSetting<string[]>(
            `${StorageKeys.settings.conversationRecalledMessagesPrefix}${clientConversationId}`
          )
        ])
        const terminal = {
          clearBefore: clearBefore || 0,
          deletedKeys: new Set(deletedKeys || []),
          recalledKeys: new Set(recalledKeys || [])
        }
        terminalStates.set(clientConversationId, terminal)
        return terminal
      }

      const addChanged = (
        conversation: Conversation,
        message: Message,
        options?: PersistMessageRecordOptions
      ) => {
        const clientConversationId = getClientConversationId(
          conversation.type,
          conversation.targetId
        )
        changedConversations.set(clientConversationId, conversation)
        persistedMessages.set(getMessageKey(message, conversation.type), {
          message,
          conversationType: conversation.type,
          mergeClientRecord: options?.mergeClientRecord
        })
      }

      // 1. 按消息顺序构建待提交投影
      for (const pulledMessage of pulledMessages) {
        if (pulledMessage.kind === 'recall') {
          // 1.1 撤回信号在事务内读取原消息后统一处理
          recallMessages.push(pulledMessage)
          continue
        }

        const { conversationInfo } = pulledMessage
        const hasServerClientMessageId = !!pulledMessage.message.clientMessageId
        let message = ensureClientMessageId(pulledMessage.message)
        const clientConversationId = getClientConversationId(
          conversationInfo.type,
          conversationInfo.targetId
        )
        if (conversationInfo.type === ImConversationType.GROUP) {
          const groupNotification = isGroupNotification(message.type)
          if (groupNotification) {
            await groupStore.applyGroupNotificationNow(
              conversationInfo.targetId,
              message.type,
              message.content,
              message.id,
              db
            )
          }
          const staged = conversationProjections.get(clientConversationId)
          if (staged) {
            if (isRelationTerminated(clientConversationId)) {
              staged.conversation.deleted = true
              staged.conversation.draft = undefined
            } else if (groupNotification) {
              staged.conversation.deleted = false
            }
          }
        }
        const terminal = await getTerminal(clientConversationId)
        if (isMessageTerminated(message, terminal)) {
          continue
        }
        message = applyPersistedRecall(message, terminal)
        // 1.2 获取或创建当前批次的待提交投影
        let projection = conversationProjections.get(clientConversationId)
        if (!projection) {
          const currentMessages = this.messagesByConversation[clientConversationId] || []
          projection = {
            conversation: conversationStore.buildConversationProjection(conversationInfo),
            currentMessages,
            nextMessages: [...currentMessages]
          }
          conversationProjections.set(clientConversationId, projection)
        }
        const conversation = projection.conversation
        const messages = projection.nextMessages
        const isActive =
          conversationStore.activeConversation?.type === conversationInfo.type &&
          conversationStore.activeConversation?.targetId === conversationInfo.targetId
        const isUnread =
          !message.selfSend &&
          !isActive &&
          !conversationStore.isMessageCoveredByReadPosition(conversation, message) &&
          isNormalMessage(message.type) &&
          message.status !== ImMessageStatus.RECALL
        let existingIndex = messages.findIndex((existing) => isSameMessage(existing, message))
        if (existingIndex < 0 && message.id) {
          const messageId = message.id
          const storedMessage = await db.get<MessageDO>(
            'messages',
            getServerMessageKey(conversationInfo.type, messageId)
          )
          if (storedMessage) {
            existingIndex = messages.findIndex((existing) => existing.id && compareId(messageId, existing.id) < 0)
            if (existingIndex < 0) {
              existingIndex = messages.length
            }
            messages.splice(existingIndex, 0, buildMessageFromDO(storedMessage))
          }
        }
        if (existingIndex >= 0) {
          // 1.3 已存在消息合并服务端状态
          const existing = messages[existingIndex]
          const reduced = reduceMessageState(
            { priority: getMessageTerminalPriority(existing), value: existing },
            { priority: getMessageTerminalPriority(message), value: message }
          )
          if (reduced.value === message) {
            messages[existingIndex] = buildServerMessageProjection(existing, message)
          }
          const mergedMessage = messages[existingIndex]
          if (
            existingIndex === messages.length - 1 &&
            shouldUpdateConversationSummary(conversation, mergedMessage)
          ) {
            recomputeConversationLast(conversation, messages, db)
          }
          if (isUnread) {
            syncConversationAtFlags(conversation, message, db.userId)
          }
          addChanged(conversation, messages[existingIndex], {
            mergeClientRecord: hasServerClientMessageId
          })
          continue
        }

        // 1.4 新消息更新会话摘要和未读状态
        if (shouldUpdateConversationSummary(conversation, message)) {
          applyConversationSummary(conversation, message, db)
        }
        if (isUnread) {
          syncConversationAtFlags(conversation, message, db.userId)
          conversation.unreadCount++
        }

        // 1.5 新消息按服务端 id 插入待提交列表
        let insertIndex = messages.length
        if (message.id) {
          for (let index = 0; index < messages.length; index++) {
            const existing = messages[index]
            if (existing.id && compareId(message.id, existing.id) < 0) {
              insertIndex = index
              break
            }
          }
        }
        messages.splice(insertIndex, 0, message)
        addChanged(conversation, message, {
          mergeClientRecord: hasServerClientMessageId && !!message.id
        })
      }

      // 2. 单事务写入消息、会话摘要和游标
      await db.transaction(['messages', 'conversations', 'settings'], 'readwrite', async (tx) => {
        // 2.1 写入本批变更消息
        for (const item of persistedMessages.values()) {
          await this.saveMessageRecord(
            item.message,
            item.conversationType,
            tx,
            {
              mergeClientRecord: item.mergeClientRecord
            },
            db
          )
        }
        // 2.2 应用本批撤回信号
        for (const recallMessage of recallMessages) {
          const staged = conversationProjections.get(
            getClientConversationId(recallMessage.conversationType, recallMessage.targetId)
          )
          const changed = await this.applyRecallMessageRecord(
            recallMessage.conversationType,
            recallMessage.targetId,
            recallMessage.recallSignalContent,
            tx,
            staged
              ? { conversation: staged.conversation, messages: staged.nextMessages }
              : undefined,
            db
          )
          if (changed) {
            const clientConversationId = getClientConversationId(
              changed.conversation.type,
              changed.conversation.targetId
            )
            let projection = conversationProjections.get(clientConversationId)
            if (!projection) {
              const currentMessages = this.messagesByConversation[clientConversationId] || []
              projection = {
                conversation: changed.conversation,
                currentMessages,
                nextMessages: [...currentMessages]
              }
              conversationProjections.set(clientConversationId, projection)
            } else {
              projection.conversation = changed.conversation
            }
            const recalledIndex = projection.nextMessages.findIndex(
              (message) => message.id === changed.message.id
            )
            if (recalledIndex >= 0) {
              projection.nextMessages[recalledIndex] = changed.message
            }
            changedConversations.set(clientConversationId, changed.conversation)
          }
        }
        // 2.3 写入本批变更会话
        await conversationStore.saveConversationRecord([...changedConversations.values()], tx, db)
        // 2.4 写入本批游标
        await setMessageMaxId(conversationType, maxMessageId, tx, db)
      })
      // 3. 持久化成功后推进内存游标
      for (const [clientConversationId, projection] of conversationProjections) {
        for (const current of projection.currentMessages) {
          const next = projection.nextMessages.find((message) => isSameMessage(message, current))
          if (next && next.content !== current.content) {
            revokeBlobUrlsInContent(current.content)
          }
        }
        this.messagesByConversation[clientConversationId] = projection.nextMessages
        this.touchConversationMessageCache(clientConversationId)
        conversationStore.publishConversationProjection(projection.conversation, true)
      }
      this.updateMessageCursor(conversationType, maxMessageId)
    },

    /** 把实时或本地消息投入会话串行写 lane */
    async insertMessage(
      conversationInfo: MessageConversationInfo,
      messageInfo: Message,
      db: DbClient = getDb()
    ): Promise<boolean> {
      const clientConversationId = getClientConversationId(
        conversationInfo.type,
        conversationInfo.targetId
      )
      await enqueueConversationWrite(clientConversationId, () =>
        this.insertMessageNow(conversationInfo, messageInfo, db)
      )
      return true
    },

    /** 实际插入消息；调用方必须持有当前会话写 lane */
    async insertMessageNow(
      conversationInfo: MessageConversationInfo,
      messageInfo: Message,
      db: DbClient
    ): Promise<void> {
      const conversationStore = useConversationStore()
      const hasIncomingClientMessageId = !!messageInfo.clientMessageId
      let message = ensureClientMessageId(messageInfo)
      const clientConversationId = getClientConversationId(
        conversationInfo.type,
        conversationInfo.targetId
      )
      const [clearBefore, deletedKeys, recalledKeys] = await Promise.all([
        db.getSetting<number>(
          `${StorageKeys.settings.conversationClearBeforePrefix}${clientConversationId}`
        ),
        db.getSetting<string[]>(
          `${StorageKeys.settings.conversationDeletedMessagesPrefix}${clientConversationId}`
        ),
        db.getSetting<string[]>(
          `${StorageKeys.settings.conversationRecalledMessagesPrefix}${clientConversationId}`
        )
      ])
      const terminal = {
        clearBefore: clearBefore || 0,
        deletedKeys: new Set(deletedKeys || []),
        recalledKeys: new Set(recalledKeys || [])
      }
      if (isMessageTerminated(message, terminal)) {
        return
      }
      message = applyPersistedRecall(message, terminal)
      // 1. 先处理消息带来的群资料变更
      if (conversationInfo.type === ImConversationType.GROUP) {
        if (isGroupNotification(message.type)) {
          await useGroupStore().applyGroupNotificationNow(
            conversationInfo.targetId,
            message.type,
            message.content,
            message.id,
            db
          )
        }
      }

      // 2. 构建会话和消息的下一份投影，不提前修改响应式状态
      const conversation = conversationStore.buildConversationProjection(conversationInfo)
      const currentMessages = this.messagesByConversation[clientConversationId] || []
      const messages = [...currentMessages]
      let existingIndex = messages.findIndex((item) => isSameMessage(item, message))
      if (existingIndex < 0 && message.id) {
        const messageId = message.id
        const storedMessage = await db.get<MessageDO>(
          'messages',
          getServerMessageKey(conversationInfo.type, messageId)
        )
        if (storedMessage) {
          existingIndex = messages.findIndex((existing) => existing.id && compareId(messageId, existing.id) < 0)
          if (existingIndex < 0) {
            existingIndex = messages.length
          }
          messages.splice(existingIndex, 0, buildMessageFromDO(storedMessage))
        }
      }
      const isActive =
        conversationStore.activeConversation?.type === conversationInfo.type &&
        conversationStore.activeConversation?.targetId === conversationInfo.targetId
      const isUnread =
        existingIndex < 0 &&
        !message.selfSend &&
        !isActive &&
        !conversationStore.isMessageCoveredByReadPosition(conversation, message) &&
        isNormalMessage(message.type) &&
        message.status !== ImMessageStatus.RECALL
      // 3. 已存在消息走覆盖更新
      if (existingIndex >= 0) {
        const existing = messages[existingIndex]
        const reduced = reduceMessageState(
          { priority: getMessageTerminalPriority(existing), value: existing },
          { priority: getMessageTerminalPriority(message), value: message }
        )
        if (reduced.value === message) {
          messages[existingIndex] = buildServerMessageProjection(existing, message)
        }
        if (
          existingIndex === messages.length - 1 &&
          shouldUpdateConversationSummary(conversation, messages[existingIndex])
        ) {
          recomputeConversationLast(conversation, messages, db)
        }
        if (isUnread) {
          syncConversationAtFlags(conversation, message, db.userId)
        }
        await db
          .transaction(['messages', 'conversations'], 'readwrite', async (tx) => {
            await this.saveMessageRecord(
              messages[existingIndex],
              conversationInfo.type,
              tx,
              {
                mergeClientRecord: hasIncomingClientMessageId
              },
              db
            )
            await conversationStore.saveConversationRecord(conversation, tx, db)
          })
          .catch((e) => {
            console.error('[IM messageStore] 消息写入失败', e)
            throw e
          })
        const currentMessage = currentMessages.find((item) => isSameMessage(item, message))
        if (currentMessage && currentMessage.content !== messages[existingIndex].content) {
          revokeBlobUrlsInContent(currentMessage.content)
        }
        this.messagesByConversation[clientConversationId] = messages
        this.touchConversationMessageCache(clientConversationId)
        conversationStore.publishConversationProjection(conversation, true)
        return
      }

      // 4. 新消息更新会话摘要和未读状态
      if (shouldUpdateConversationSummary(conversation, message)) {
        applyConversationSummary(conversation, message, db)
      }
      if (isUnread) {
        syncConversationAtFlags(conversation, message, db.userId)
        conversation.unreadCount++
      }

      // 5. 新消息按 id 插入到待发布数组
      let insertIndex = messages.length
      if (message.id) {
        for (let index = 0; index < messages.length; index++) {
          const existing = messages[index]
          if (existing.id && compareId(message.id, existing.id) < 0) {
            insertIndex = index
            break
          }
        }
      }
      messages.splice(insertIndex, 0, message)
      // 6. 单事务写入消息和会话摘要
      await db
        .transaction(['messages', 'conversations'], 'readwrite', async (tx) => {
          await this.saveMessageRecord(
            message,
            conversationInfo.type,
            tx,
            {
              mergeClientRecord: hasIncomingClientMessageId && !!message.id
            },
            db
          )
          await conversationStore.saveConversationRecord(conversation, tx, db)
        })
        .catch((e) => {
          console.error('[IM messageStore] 消息写入失败', e)
          throw e
        })
      this.messagesByConversation[clientConversationId] = messages
      this.touchConversationMessageCache(clientConversationId)
      conversationStore.publishConversationProjection(conversation, true)
    },

    /** ack 合并 */
    ackMessage(
      conversationType: number,
      targetId: number,
      clientMessageId: string,
      updates: Partial<Message>,
      db: DbClient = getDb()
    ) {
      const mergeKey = `${conversationType}:${targetId}:${clientMessageId}`
      const existingPromise = ackMergingPromises.get(mergeKey)
      if (existingPromise) {
        return existingPromise
      }
      const promise = this.doAckMessage(
        conversationType,
        targetId,
        clientMessageId,
        updates,
        db
      ).finally(() => {
        ackMergingPromises.delete(mergeKey)
      })
      ackMergingPromises.set(mergeKey, promise)
      return promise
    },

    /** 执行 ack 合并 */
    async doAckMessage(
      conversationType: number,
      targetId: number,
      clientMessageId: string,
      updates: Partial<Message>,
      db: DbClient = getDb()
    ) {
      await enqueueConversationWrite(getClientConversationId(conversationType, targetId), () =>
        this.doAckMessageNow(conversationType, targetId, clientMessageId, updates, db)
      )
    },

    /** 实际执行 ack 合并；调用方必须持有当前会话写 lane */
    async doAckMessageNow(
      conversationType: number,
      targetId: number,
      clientMessageId: string,
      updates: Partial<Message>,
      db: DbClient
    ) {
      // 1. 从任务绑定的 DB 读取待合并消息和会话，避免内存窗口淘汰后丢 ACK
      const conversationStore = useConversationStore()
      const clientConversationId = getClientConversationId(conversationType, targetId)
      const currentConversation = conversationStore.getConversation(conversationType, targetId)
      const currentMessages = this.messagesByConversation[clientConversationId]
      const currentMessage = currentMessages?.find(
        (item) => item.clientMessageId === clientMessageId
      )
      const [storedMessage, storedConversation] = await Promise.all([
        db.getByIndex<MessageDO>('messages', 'clientMessageId', clientMessageId),
        db.get<ConversationDO>('conversations', clientConversationId)
      ])
      if (!storedMessage) {
        return
      }
      const message = buildMessageFromDO(storedMessage)
      if (currentMessage) {
        currentMessage._ackMerging = true
      }
      try {
        // 2. 构建服务端 ack 的下一份投影
        const incoming = { ...message, ...updates }
        const reduced = reduceMessageState(
          { priority: getMessageTerminalPriority(message), value: message },
          { priority: getMessageTerminalPriority(incoming), value: incoming }
        )
        let nextMessage: Message
        if (reduced.value === incoming) {
          nextMessage = buildServerMessageProjection(message, updates)
        } else {
          const nonTerminalUpdates = { ...updates }
          delete nonTerminalUpdates.type
          delete nonTerminalUpdates.status
          delete nonTerminalUpdates.content
          nextMessage = buildServerMessageProjection(message, nonTerminalUpdates)
        }
        nextMessage._ackMerging = undefined
        const nextConversation = storedConversation
          ? buildConversationFromDO(storedConversation)
          : undefined
        if (
          nextConversation &&
          (nextConversation.lastClientMessageId === clientMessageId ||
            (!!message.id && nextConversation.lastMessageId === message.id))
        ) {
          applyConversationSummary(nextConversation, nextMessage, db)
        }
        // 3. 单事务写入消息和会话摘要；ACK 不推进 pull cursor
        await db
          .transaction(['messages', 'conversations'], 'readwrite', async (tx) => {
            await this.saveMessageRecord(
              nextMessage,
              conversationType,
              tx,
              {
                mergeClientRecord: true
              },
              db
            )
            if (nextConversation) {
              await conversationStore.saveConversationRecord(nextConversation, tx, db)
            }
          })
          .catch((e) => {
            console.error('[IM messageStore] ack 写入失败', e)
            throw e
          })
        // 4. 仅更新仍由当前 Store 持有的旧投影；DB-only ACK 不重新撑开 LRU 窗口
        if (
          currentMessage &&
          currentMessages &&
          this.messagesByConversation[clientConversationId] === currentMessages
        ) {
          applyServerMessageUpdate(currentMessage, nextMessage)
        }
        if (
          nextConversation &&
          currentConversation &&
          conversationStore.getConversation(conversationType, targetId) === currentConversation
        ) {
          conversationStore.publishConversationProjection(nextConversation, true)
        }
      } finally {
        if (currentMessage) {
          currentMessage._ackMerging = false
        }
      }
    },

    /** 局部更新消息 */
    patchMessage(
      conversationType: number,
      targetId: number,
      clientMessageId: string,
      patch: Partial<Message>
    ) {
      const message = this.getMessageList(conversationType, targetId).find(
        (item) => item.clientMessageId === clientMessageId
      )
      if (!message) {
        return
      }
      let changed = false
      for (const key in patch) {
        if (
          Object.prototype.hasOwnProperty.call(patch, key) &&
          (patch as Record<string, unknown>)[key] !==
            (message as unknown as Record<string, unknown>)[key]
        ) {
          changed = true
          break
        }
      }
      if (changed) {
        applyServerMessageUpdate(message, patch)
      }
    },

    /** 撤回消息 */
    async recallMessage(
      conversationType: number,
      targetId: number,
      recallSignalContent: string,
      db: DbClient = getDb()
    ): Promise<void> {
      await enqueueConversationWrite(getClientConversationId(conversationType, targetId), () =>
        this.recallMessageNow(conversationType, targetId, recallSignalContent, db)
      )
    },

    /** 实际应用撤回终态；调用方必须持有当前会话写 lane */
    async recallMessageNow(
      conversationType: number,
      targetId: number,
      recallSignalContent: string,
      db: DbClient
    ): Promise<void> {
      const conversationStore = useConversationStore()
      const changed = await db
        .transaction(['messages', 'conversations', 'settings'], 'readwrite', async (tx) => {
          const changed = await this.applyRecallMessageRecord(
            conversationType,
            targetId,
            recallSignalContent,
            tx,
            undefined,
            db
          )
          if (!changed) {
            return null
          }
          await conversationStore.saveConversationRecord(changed.conversation, tx, db)
          return changed
        })
        .catch((e) => {
          console.error('[IM messageStore] 撤回消息写入失败', e)
          throw e
        })
      if (!changed) {
        return
      }
      if (changed.cachedMessage) {
        revokeBlobUrlsInContent(changed.cachedMessage.content)
        Object.assign(changed.cachedMessage, changed.message)
      }
      conversationStore.publishConversationProjection(changed.conversation, true)
    },

    /** 应用已读回执 */
    async applyMessageReadReceipt(
      options: {
        conversationType: number
        targetId: number
        privateReadMaxId?: number
        groupMessageId?: number
        readCount?: number
        receiptStatus?: number
      },
      db: DbClient = getDb()
    ) {
      await enqueueConversationWrite(
        getClientConversationId(options.conversationType, options.targetId),
        () => this.applyMessageReadReceiptNow(options, db)
      )
    },

    /** 实际应用消息回执；调用方必须持有当前会话写 lane */
    async applyMessageReadReceiptNow(
      options: {
        conversationType: number
        targetId: number
        privateReadMaxId?: number
        groupMessageId?: number
        readCount?: number
        receiptStatus?: number
      },
      db: DbClient
    ) {
      const clientConversationId = getClientConversationId(
        options.conversationType,
        options.targetId
      )
      const messages = this.messagesByConversation[clientConversationId] || []
      const changed: Array<{ current: Message; next: Message }> = []
      const durableChanges = new Map<string, MessageDO>()
      // 1. 私聊回执批量更新自己发送的消息
      if (options.conversationType === ImConversationType.PRIVATE && options.privateReadMaxId) {
        messages.forEach((message) => {
          if (
            message.selfSend &&
            message.id &&
            compareId(message.id, options.privateReadMaxId!) <= 0 &&
            message.receiptStatus === ImMessageReceiptStatus.PENDING
          ) {
            changed.push({
              current: message,
              next: { ...message, receiptStatus: ImMessageReceiptStatus.DONE }
            })
          }
        })
        const storedMessages = await db.getAllByIndex<MessageDO>(
          'messages',
          'clientConversationId',
          clientConversationId
        )
        const storedByKey = new Map(storedMessages.map((message) => [message.messageKey, message]))
        storedMessages
          .filter(
            (message) =>
              message.selfSend &&
              !!message.id &&
              compareId(message.id, options.privateReadMaxId!) <= 0 &&
              message.receiptStatus === ImMessageReceiptStatus.PENDING
          )
          .forEach((message) => {
            const next = { ...message, receiptStatus: ImMessageReceiptStatus.DONE }
            durableChanges.set(next.messageKey, next)
          })
        changed.forEach(({ next }) => {
          const record = buildMessageDO(next, options.conversationType)
          if (!durableChanges.has(record.messageKey)) {
            durableChanges.set(record.messageKey, {
              ...storedByKey.get(record.messageKey),
              ...record
            })
          }
        })
      } else if (options.conversationType === ImConversationType.GROUP && options.groupMessageId) {
        // 2. 群聊回执更新单条消息
        const message = messages.find((item) => item.id === options.groupMessageId)
        const storedMessage = await db.get<MessageDO>(
          'messages',
          getServerMessageKey(options.conversationType, options.groupMessageId)
        )
        const nextReadCount =
          message?.readCount === undefined &&
          storedMessage?.readCount === undefined &&
          options.readCount === undefined
            ? undefined
            : Math.max(
                message?.readCount ?? 0,
                storedMessage?.readCount ?? 0,
                options.readCount ?? 0
              )
        const nextReceiptStatus =
          message?.receiptStatus === undefined &&
          storedMessage?.receiptStatus === undefined &&
          options.receiptStatus === undefined
            ? undefined
            : Math.max(
                message?.receiptStatus ?? 0,
                storedMessage?.receiptStatus ?? 0,
                options.receiptStatus ?? 0
              )
        if (message) {
          const next = {
            ...message,
            readCount: nextReadCount,
            receiptStatus: nextReceiptStatus
          }
          if (
            next.readCount !== message.readCount ||
            next.receiptStatus !== message.receiptStatus
          ) {
            changed.push({ current: message, next })
          }
        }
        if (storedMessage) {
          const next = {
            ...storedMessage,
            readCount: nextReadCount,
            receiptStatus: nextReceiptStatus
          }
          if (
            next.readCount !== storedMessage.readCount ||
            next.receiptStatus !== storedMessage.receiptStatus
          ) {
            durableChanges.set(next.messageKey, next)
          }
        } else if (message && changed.length > 0) {
          const record = buildMessageDO(changed[0].next, options.conversationType)
          durableChanges.set(record.messageKey, record)
        }
      }
      if (changed.length === 0 && durableChanges.size === 0) {
        if (options.conversationType === ImConversationType.PRIVATE) {
          this.updatePrivateReadMaxId(options.targetId, options.privateReadMaxId)
        }
        return
      }
      // 3. 单事务写入变更消息
      await db
        .transaction(['messages'], 'readwrite', async (tx) => {
          for (const message of durableChanges.values()) {
            await db.put('messages', message, tx)
          }
        })
        .catch((e) => {
          console.warn('[IM messageStore] 回执写入失败', e)
          throw e
        })
      changed.forEach((item) => Object.assign(item.current, item.next))
      if (options.conversationType === ImConversationType.PRIVATE) {
        this.updatePrivateReadMaxId(options.targetId, options.privateReadMaxId)
      }
    },

    /** 前置历史消息 */
    async prependMessageList(
      conversationType: number,
      targetId: number,
      earlierMessages: Message[],
      db: DbClient = getDb()
    ): Promise<void> {
      await enqueueConversationWrite(getClientConversationId(conversationType, targetId), () =>
        this.prependMessageListNow(conversationType, targetId, earlierMessages, db)
      )
    },

    /** 实际前置历史消息；调用方必须持有当前会话写 lane */
    async prependMessageListNow(
      conversationType: number,
      targetId: number,
      earlierMessages: Message[],
      db: DbClient
    ) {
      if (earlierMessages.length === 0) {
        return
      }
      const clientConversationId = getClientConversationId(conversationType, targetId)
      const terminal = await getConversationMessageTerminal(clientConversationId, db)
      const messages = this.messagesByConversation[clientConversationId] || []
      const existingIds = new Set(messages.map((message) => message.id).filter(Boolean))
      const fresh = earlierMessages
        .map(ensureClientMessageId)
        .filter(
          (message) =>
            message.id && !existingIds.has(message.id) && !isMessageTerminated(message, terminal)
        )
        .map((message) => applyPersistedRecall(message, terminal))
        .sort((messageA, messageB) => compareId(messageA.id || 0, messageB.id || 0))
      if (fresh.length === 0) {
        return
      }
      const key = getClientConversationId(conversationType, targetId)
      const nextMessages = [...fresh, ...messages]
      await db
        .transaction(['messages'], 'readwrite', async (tx) => {
          for (const message of fresh) {
            await this.saveMessageRecord(message, conversationType, tx, undefined, db)
          }
        })
        .catch((e) => {
          console.warn('[IM messageStore] 历史消息写入失败', e)
          throw e
        })
      this.messagesByConversation[key] = nextMessages
      this.touchConversationMessageCache(key)
    },

    /** 删除单条消息 */
    async removeMessage(
      conversationType: number,
      targetId: number,
      key: { id?: number; clientMessageId?: string },
      db: DbClient = getDb()
    ) {
      await enqueueConversationWrite(getClientConversationId(conversationType, targetId), () =>
        this.removeMessageNow(conversationType, targetId, key, db)
      )
    },

    /** 实际持久删除单条消息；调用方必须持有当前会话写 lane */
    async removeMessageNow(
      conversationType: number,
      targetId: number,
      key: { id?: number; clientMessageId?: string },
      db: DbClient
    ) {
      // 1. 定位会话和消息
      const conversationStore = useConversationStore()
      const conversation = conversationStore.getConversation(conversationType, targetId)
      if (!conversation) {
        return
      }
      const messages = this.getMessageList(conversationType, targetId)
      const index = messages.findIndex((message) => {
        if (key.id && message.id && message.id === key.id) {
          return true
        }
        return !!key.clientMessageId && message.clientMessageId === key.clientMessageId
      })
      if (index < 0) {
        return
      }
      const removed = messages[index]
      const clientConversationId = getClientConversationId(conversationType, targetId)
      let nextMessages = messages.filter((_, messageIndex) => messageIndex !== index)
      const nextConversation = { ...conversation }
      // 2. 先持久化 delete key，再删除消息并保存会话摘要
      await db.transaction(['messages', 'conversations', 'settings'], 'readwrite', async (tx) => {
        const settingKey = `${StorageKeys.settings.conversationDeletedMessagesPrefix}${clientConversationId}`
        const oldKeys = (await db.getSetting<string[]>(settingKey, tx)) || []
        const deletedKeys = [
          ...(removed.id ? [`id:${removed.id}`] : []),
          ...(removed.clientMessageId ? [`client:${removed.clientMessageId}`] : [])
        ]
        await db.setSetting(settingKey, Array.from(new Set([...oldKeys, ...deletedKeys])), tx)
        await db.delete('messages', getMessageKey(removed, conversationType), tx)
        if (index === nextMessages.length) {
          if (nextMessages.length === 0) {
            const storedMessages = await db.getAllByIndex<MessageDO>(
              'messages',
              'clientConversationId',
              clientConversationId,
              tx
            )
            const latest = storedMessages.sort(compareConversationSummaryOrder).at(-1)
            nextMessages = latest ? [buildMessageFromDO(latest)] : []
          }
          recomputeConversationLast(nextConversation, nextMessages, db)
        }
        await conversationStore.saveConversationRecord(nextConversation, tx, db)
      })
      // 3. 事务提交后发布内存投影
      revokeBlobUrlsInContent(removed.content)
      this.messagesByConversation[clientConversationId] = nextMessages
      conversationStore.publishConversationProjection(nextConversation, true)
    },

    /** 实际清空会话消息；调用方必须持有当前会话写 lane */
    async deleteConversationMessageListNow(
      conversationType: number,
      targetId: number,
      db: DbClient
    ) {
      const clientConversationId = getClientConversationId(conversationType, targetId)
      const messages = this.messagesByConversation[clientConversationId] || []
      const conversation = useConversationStore().getConversation(conversationType, targetId)
      // 1. 先持久化 clear watermark，再删除当前会话消息
      await db.transaction(['messages', 'settings'], 'readwrite', async (tx) => {
        const storedMessages = await db.getAllByIndex<MessageDO>(
          'messages',
          'clientConversationId',
          clientConversationId,
          tx
        )
        const settingKey = `${StorageKeys.settings.conversationClearBeforePrefix}${clientConversationId}`
        const oldClearBefore = (await db.getSetting<number>(settingKey, tx)) || 0
        const deletedSettingKey = `${StorageKeys.settings.conversationDeletedMessagesPrefix}${clientConversationId}`
        const oldDeletedKeys = (await db.getSetting<string[]>(deletedSettingKey, tx)) || []
        const pendingClientKeys = new Set(
          [...storedMessages, ...messages]
            .filter((message) => !message.id && !!message.clientMessageId)
            .map((message) => `client:${message.clientMessageId}`)
        )
        const clearBefore = maxImId(oldClearBefore, conversation?.lastMessageId || 0, ...storedMessages.map((message) => message.id || 0))
        await db.setSetting(settingKey, clearBefore, tx)
        if (pendingClientKeys.size > 0) {
          await db.setSetting(
            deletedSettingKey,
            Array.from(new Set([...oldDeletedKeys, ...pendingClientKeys])),
            tx
          )
        }
        await db.deleteByIndex('messages', 'clientConversationId', clientConversationId, tx)
      })
      // 2. 事务提交后清理内存消息和媒体资源
      messages.forEach((message) => {
        revokeBlobUrlsInContent(message.content)
        message._localFile = undefined
      })
      delete this.messagesByConversation[clientConversationId]
      delete this.messageDOPageCursors[clientConversationId]
      this.loadedConversationKeys = this.loadedConversationKeys.filter(
        (key) => key !== clientConversationId
      )
    }
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMessageStore, import.meta.hot))
}
