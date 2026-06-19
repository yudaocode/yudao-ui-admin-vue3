import { acceptHMRUpdate, defineStore } from 'pinia'
import { store } from '@/store'

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
  type DbTransaction
} from '../../utils/db'
import {
  generateClientMessageId,
  parseRecallMessageId,
  revokeBlobUrlsInContent
} from '../../utils/message'
import { resolveConversationLastContent } from '../../utils/conversation'
import { getCurrentUserId } from '@/utils/auth'
import { isGroupQuit, tryGetSenderDisplayName } from '../../utils/user'
import { useGroupStore } from './groupStore'
import { useConversationStore } from './conversationStore'
import type { Conversation, Message, MessageDO } from '../types'

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

/** 获取会话的消息缓存 key */
function getMessageCacheKey(type: number, targetId: number): string {
  return getClientConversationId(type, targetId)
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

/** 转换为 IndexedDB 消息记录 */
function buildMessageDO(message: Message, conversationType: number): MessageDO {
  return {
    id: message.id,
    clientMessageId: message.clientMessageId,
    type: message.type,
    content: message.content,
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

/** 算出末条消息的发送人快照 */
function deriveLastSenderDisplayName(
  conversation: Conversation,
  senderId: number
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
        : groupStore.fetchGroupMemberList(conversation.targetId)
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
function applyConversationSummary(conversation: Conversation, message: Message): void {
  const senderDisplayName = deriveLastSenderDisplayName(conversation, message.senderId)
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

/** 按末条消息重算会话摘要 */
function recomputeConversationLast(conversation: Conversation, messages: Message[]): void {
  const last = messages[messages.length - 1]
  if (last) {
    applyConversationSummary(conversation, last)
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
function syncConversationAtFlags(conversation: Conversation, message: Message): void {
  if (
    message.selfSend ||
    conversation.type !== ImConversationType.GROUP ||
    !message.atUserIds ||
    message.atUserIds.length === 0
  ) {
    return
  }
  const currentUserId = getCurrentUserId()
  if (currentUserId && message.atUserIds.includes(currentUserId)) {
    conversation.atMe = true
  }
  if (message.atUserIds.includes(IM_AT_ALL_USER_ID)) {
    conversation.atAll = true
  }
}

/** 应用服务端消息更新 */
function applyServerMessageUpdate(message: Message, updates: Partial<Message>): void {
  if (updates.content && updates.content !== message.content) {
    revokeBlobUrlsInContent(message.content)
  }
  Object.assign(message, updates)
  if (updates.id === 0) {
    message.id = undefined
  }
  if (updates.status !== undefined && updates.status !== ImMessageStatus.SENDING) {
    message.uploadProgress = undefined
    if (updates.status !== ImMessageStatus.FAILED) {
      message._localFile = undefined
    }
  }
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
    loadedConversationKeys: [] as string[],
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
      this.loadedConversationKeys = []
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
      if (conversationType === ImConversationType.PRIVATE && messageId > this.privateMessageMaxId) {
        this.privateMessageMaxId = messageId
      } else if (
        conversationType === ImConversationType.GROUP &&
        messageId > this.groupMessageMaxId
      ) {
        this.groupMessageMaxId = messageId
      } else if (
        conversationType === ImConversationType.CHANNEL &&
        messageId > this.channelMessageMaxId
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
      if (current !== undefined && nextMaxReadId <= current) {
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
      })
    },

    /** 加载当前会话最近消息 */
    async loadMoreMessageList(
      clientConversationId: string,
      beforeSendTime?: number,
      limit = 50
    ): Promise<Message[]> {
      // 1. 从 IndexedDB 倒序读取一页，返回前已按时间升序排列
      const list = await getDb().getMessageListByConversation(clientConversationId, {
        beforeSendTime,
        limit
      })
      // 2. 合并到内存缓存，过滤已存在的消息
      const parsed = parseClientConversationId(clientConversationId)
      if (!parsed) {
        return []
      }
      const messages = list.map(buildMessageFromDO)
      const existing = this.messagesByConversation[clientConversationId] || []
      const existingKeys = new Set(existing.map((message) => getMessageKey(message, parsed.type)))
      const fresh = messages.filter(
        (message) => !existingKeys.has(getMessageKey(message, parsed.type))
      )
      this.messagesByConversation[clientConversationId] = [...fresh, ...existing].sort(
        (messageA, messageB) => (messageA.sendTime || 0) - (messageB.sendTime || 0)
      )
      this.touchConversationMessageCache(clientConversationId)
      return fresh
    },

    /** 确保会话消息已加载 */
    async ensureConversationMessageListLoaded(conversation: Conversation) {
      const key = getMessageCacheKey(conversation.type, conversation.targetId)
      if (this.messagesByConversation[key]) {
        this.touchConversationMessageCache(key)
        return
      }
      await this.loadMoreMessageList(key)
    },

    /** 获取内存消息数组 */
    getMessageList(conversationType: number, targetId: number): Message[] {
      const key = getMessageCacheKey(conversationType, targetId)
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
      tx?: DbTransaction,
      options?: PersistMessageRecordOptions
    ) {
      const db = getDb()
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

    /** 保存消息游标 */
    async saveMessageCursor(conversationType: number, messageId?: number, tx?: DbTransaction) {
      await setMessageMaxId(conversationType, messageId, tx)
      this.updateMessageCursor(conversationType, messageId)
    },

    /** 应用撤回到内存 */
    applyRecallMessageInMemory(
      conversationType: number,
      targetId: number,
      recallSignalContent: string
    ) {
      // 1. 定位被撤回的原消息
      const messageId = parseRecallMessageId(recallSignalContent)
      if (!messageId) {
        return null
      }
      const conversationStore = useConversationStore()
      const conversation = conversationStore.getConversation(conversationType, targetId)
      if (!conversation) {
        return null
      }
      const messages = this.getMessageList(conversationType, targetId)
      const message = messages.find((item) => item.id === messageId)
      if (!message) {
        return null
      }
      // 2. 更新消息和会话摘要
      message.type = ImContentType.RECALL
      message.status = ImMessageStatus.RECALL
      message.content = ''
      if (messages[messages.length - 1]?.id === messageId) {
        recomputeConversationLast(conversation, messages)
      }
      return { conversation, message }
    },

    /** 批量写入拉取消息 */
    async applyPulledMessageList(
      pulledMessages: PulledMessage[],
      conversationType: number,
      maxMessageId?: number
    ) {
      if (pulledMessages.length === 0) {
        // 1. 空批次只推进游标
        await this.saveMessageCursor(conversationType, maxMessageId)
        return
      }
      const conversationStore = useConversationStore()
      const persistedMessages = new Map<
        string,
        { message: Message; conversationType: number; mergeClientRecord?: boolean }
      >()
      const changedConversations = new Map<string, Conversation>()

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

      // 1. 先更新内存，收集需要持久化的消息和会话
      for (const pulledMessage of pulledMessages) {
        if (pulledMessage.kind === 'recall') {
          // 1.1 撤回信号更新原消息
          const changed = this.applyRecallMessageInMemory(
            pulledMessage.conversationType,
            pulledMessage.targetId,
            pulledMessage.recallSignalContent
          )
          if (changed) {
            addChanged(changed.conversation, changed.message)
          }
          continue
        }

        const { conversationInfo } = pulledMessage
        const hasServerClientMessageId = !!pulledMessage.message.clientMessageId
        const message = ensureClientMessageId(pulledMessage.message)
        // 1.2 确保会话和消息缓存存在
        const conversation = conversationStore.ensureConversation(conversationInfo)
        const messages = this.getMessageList(conversationInfo.type, conversationInfo.targetId)
        const existingIndex = messages.findIndex((existing) => isSameMessage(existing, message))
        if (existingIndex >= 0) {
          // 1.3 已存在消息合并服务端状态
          applyServerMessageUpdate(messages[existingIndex], message)
          if (existingIndex === messages.length - 1) {
            recomputeConversationLast(conversation, messages)
            syncConversationAtFlags(conversation, message)
          }
          addChanged(conversation, messages[existingIndex], {
            mergeClientRecord: hasServerClientMessageId
          })
          continue
        }

        // 1.4 新消息更新会话摘要和未读状态
        applyConversationSummary(conversation, message)
        syncConversationAtFlags(conversation, message)
        const isActive =
          conversationStore.activeConversation?.type === conversationInfo.type &&
          conversationStore.activeConversation?.targetId === conversationInfo.targetId
        if (
          !message.selfSend &&
          !isActive &&
          !conversationStore.isMessageCoveredByReadPosition(conversation, message) &&
          isNormalMessage(message.type) &&
          message.status !== ImMessageStatus.RECALL
        ) {
          conversation.unreadCount++
        }

        // 1.5 新消息按服务端 id 插入内存列表
        let insertIndex = messages.length
        if (message.id) {
          for (let index = 0; index < messages.length; index++) {
            const existing = messages[index]
            if (existing.id && message.id < existing.id) {
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
      await getDb().transaction(
        ['messages', 'conversations', 'settings'],
        'readwrite',
        async (tx) => {
          // 2.1 写入本批变更消息
          for (const item of persistedMessages.values()) {
            await this.saveMessageRecord(item.message, item.conversationType, tx, {
              mergeClientRecord: item.mergeClientRecord
            })
          }
          // 2.2 写入本批变更会话
          await conversationStore.saveConversationRecord([...changedConversations.values()], tx)
          // 2.3 写入本批游标
          await setMessageMaxId(conversationType, maxMessageId, tx)
        }
      )
      // 3. 持久化成功后推进内存游标
      this.updateMessageCursor(conversationType, maxMessageId)
      for (const item of persistedMessages.values()) {
        this.updateMessageCursor(item.conversationType, item.message.id)
      }
    },

    /** 插入消息 */
    insertMessage(
      conversationInfo: MessageConversationInfo,
      messageInfo: Message,
      options?: { saveMaxId?: boolean }
    ): Promise<void> {
      const conversationStore = useConversationStore()
      const hasIncomingClientMessageId = !!messageInfo.clientMessageId
      const message = ensureClientMessageId(messageInfo)
      // 1. 先处理消息带来的群资料变更
      if (conversationInfo.type === ImConversationType.GROUP && isGroupNotification(message.type)) {
        useGroupStore().applyGroupNotification(
          conversationInfo.targetId,
          message.type,
          message.content
        )
      }

      // 2. 确保会话和消息缓存存在
      const conversation = conversationStore.ensureConversation(conversationInfo)
      const messages = this.getMessageList(conversationInfo.type, conversationInfo.targetId)
      const existingIndex = messages.findIndex((item) => isSameMessage(item, message))
      // 3. 已存在消息走覆盖更新
      if (existingIndex >= 0) {
        applyServerMessageUpdate(messages[existingIndex], message)
        if (existingIndex === messages.length - 1) {
          recomputeConversationLast(conversation, messages)
          syncConversationAtFlags(conversation, message)
        }
        return getDb()
          .transaction(['messages', 'conversations', 'settings'], 'readwrite', async (tx) => {
            await this.saveMessageRecord(messages[existingIndex], conversationInfo.type, tx, {
              mergeClientRecord: hasIncomingClientMessageId
            })
            await conversationStore.saveConversationRecord(conversation, tx)
            if (options?.saveMaxId !== false) {
              await setMessageMaxId(conversationInfo.type, message.id, tx)
            }
          })
          .catch((e) => {
            console.error('[IM messageStore] 消息写入失败', e)
            throw e
          })
          .then(() => {
            this.updateMessageCursor(conversationInfo.type, message.id)
          })
      }

      // 4. 新消息更新会话摘要和未读状态
      applyConversationSummary(conversation, message)
      syncConversationAtFlags(conversation, message)

      const isActive =
        conversationStore.activeConversation?.type === conversationInfo.type &&
        conversationStore.activeConversation?.targetId === conversationInfo.targetId
      if (
        !message.selfSend &&
        !isActive &&
        !conversationStore.isMessageCoveredByReadPosition(conversation, message) &&
        isNormalMessage(message.type) &&
        message.status !== ImMessageStatus.RECALL
      ) {
        conversation.unreadCount++
      }

      // 5. 新消息按 id 插入到内存数组
      let insertIndex = messages.length
      if (message.id) {
        for (let index = 0; index < messages.length; index++) {
          const existing = messages[index]
          if (existing.id && message.id < existing.id) {
            insertIndex = index
            break
          }
        }
      }
      messages.splice(insertIndex, 0, message)
      // 6. 单事务写入消息、会话摘要和游标
      return getDb()
        .transaction(['messages', 'conversations', 'settings'], 'readwrite', async (tx) => {
          await this.saveMessageRecord(message, conversationInfo.type, tx, {
            mergeClientRecord: hasIncomingClientMessageId && !!message.id
          })
          await conversationStore.saveConversationRecord(conversation, tx)
          if (options?.saveMaxId !== false) {
            await setMessageMaxId(conversationInfo.type, message.id, tx)
          }
        })
        .catch((e) => {
          console.error('[IM messageStore] 消息写入失败', e)
          throw e
        })
        .then(() => {
          this.updateMessageCursor(conversationInfo.type, message.id)
        })
    },

    /** ack 合并 */
    ackMessage(
      conversationType: number,
      targetId: number,
      clientMessageId: string,
      updates: Partial<Message>
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
        updates
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
      updates: Partial<Message>
    ) {
      // 1. 定位待合并消息
      const conversationStore = useConversationStore()
      const conversation = conversationStore.getConversation(conversationType, targetId)
      if (!conversation) {
        return
      }
      const messages = this.getMessageList(conversationType, targetId)
      const message = messages.find((item) => item.clientMessageId === clientMessageId)
      if (!message) {
        return
      }
      message._ackMerging = true
      try {
        // 2. 合并服务端 ack 到内存
        applyServerMessageUpdate(message, updates)
        if (messages[messages.length - 1] === message) {
          recomputeConversationLast(conversation, messages)
        }
        // 3. 单事务写入消息、会话摘要和游标
        await getDb()
          .transaction(['messages', 'conversations', 'settings'], 'readwrite', async (tx) => {
            await this.saveMessageRecord(message, conversationType, tx, {
              mergeClientRecord: true
            })
            await conversationStore.saveConversationRecord(conversation, tx)
            await setMessageMaxId(conversationType, message.id, tx)
          })
          .catch((e) => {
            console.error('[IM messageStore] ack 写入失败', e)
            throw e
          })
        this.updateMessageCursor(conversationType, message.id)
      } finally {
        // 4. 清理合并标记
        message._ackMerging = false
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
      recallSignalContent: string
    ): Promise<void> {
      const conversationStore = useConversationStore()
      const changed = this.applyRecallMessageInMemory(
        conversationType,
        targetId,
        recallSignalContent
      )
      if (!changed) {
        return
      }
      await getDb()
        .transaction(['messages', 'conversations'], 'readwrite', async (tx) => {
          await this.saveMessageRecord(changed.message, conversationType, tx)
          await conversationStore.saveConversationRecord(changed.conversation, tx)
        })
        .catch((e) => {
          console.error('[IM messageStore] 撤回消息写入失败', e)
          throw e
        })
    },

    /** 应用已读回执 */
    applyMessageReadReceipt(options: {
      conversationType: number
      targetId: number
      privateReadMaxId?: number
      groupMessageId?: number
      readCount?: number
      receiptStatus?: number
    }) {
      const messages = this.getMessageList(options.conversationType, options.targetId)
      const changed: Message[] = []
      // 1. 私聊回执批量更新自己发送的消息
      if (options.conversationType === ImConversationType.PRIVATE && options.privateReadMaxId) {
        this.updatePrivateReadMaxId(options.targetId, options.privateReadMaxId)
        messages.forEach((message) => {
          if (
            message.selfSend &&
            message.id &&
            message.id <= options.privateReadMaxId! &&
            message.receiptStatus === ImMessageReceiptStatus.PENDING
          ) {
            message.receiptStatus = ImMessageReceiptStatus.DONE
            changed.push(message)
          }
        })
      } else if (options.conversationType === ImConversationType.GROUP && options.groupMessageId) {
        // 2. 群聊回执更新单条消息
        const message = messages.find((item) => item.id === options.groupMessageId)
        if (message) {
          if (options.readCount !== undefined) {
            message.readCount = options.readCount
          }
          if (options.receiptStatus !== undefined) {
            message.receiptStatus = options.receiptStatus
          }
          changed.push(message)
        }
      }
      if (changed.length === 0) {
        return
      }
      // 3. 单事务写入变更消息
      void getDb()
        .transaction(['messages'], 'readwrite', async (tx) => {
          for (const message of changed) {
            await this.saveMessageRecord(message, options.conversationType, tx)
          }
        })
        .catch((e) => console.warn('[IM messageStore] 回执写入失败', e))
    },

    /** 前置历史消息 */
    prependMessageList(conversationType: number, targetId: number, earlierMessages: Message[]) {
      if (earlierMessages.length === 0) {
        return
      }
      const messages = this.getMessageList(conversationType, targetId)
      const existingIds = new Set(messages.map((message) => message.id).filter(Boolean))
      const fresh = earlierMessages
        .map(ensureClientMessageId)
        .filter((message) => message.id && !existingIds.has(message.id))
        .sort((messageA, messageB) => (messageA.id || 0) - (messageB.id || 0))
      if (fresh.length === 0) {
        return
      }
      const key = getMessageCacheKey(conversationType, targetId)
      this.messagesByConversation[key] = [...fresh, ...messages]
      void getDb()
        .transaction(['messages'], 'readwrite', async (tx) => {
          for (const message of fresh) {
            await this.saveMessageRecord(message, conversationType, tx)
          }
        })
        .catch((e) => console.warn('[IM messageStore] 历史消息写入失败', e))
    },

    /** 删除单条消息 */
    removeMessage(
      conversationType: number,
      targetId: number,
      key: { id?: number; clientMessageId?: string }
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
      // 2. 从内存移除消息
      const [removed] = messages.splice(index, 1)
      revokeBlobUrlsInContent(removed.content)
      if (index === messages.length) {
        recomputeConversationLast(conversation, messages)
      }
      // 3. 删除本地记录并保存会话摘要
      getDb()
        .delete('messages', getMessageKey(removed, conversationType))
        .catch((e) => console.warn('[IM messageStore] 消息删除失败', e))
      conversationStore.saveConversation(conversation)
    },

    /** 删除会话全部消息 */
    deleteConversationMessageList(conversationType: number, targetId: number) {
      // 1. 清理内存消息和媒体资源
      const clientConversationId = getClientConversationId(conversationType, targetId)
      const messages = this.messagesByConversation[clientConversationId] || []
      messages.forEach((message) => {
        revokeBlobUrlsInContent(message.content)
        message._localFile = undefined
      })
      delete this.messagesByConversation[clientConversationId]
      this.loadedConversationKeys = this.loadedConversationKeys.filter(
        (key) => key !== clientConversationId
      )
      // 2. 删除 IndexedDB 消息
      getDb()
        .deleteByIndex('messages', 'clientConversationId', clientConversationId)
        .catch((e) => console.warn('[IM messageStore] 会话消息删除失败', e))
    }
  }
})

export const useMessageStoreWithOut = () => useMessageStore(store)

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMessageStore, import.meta.hot))
}
