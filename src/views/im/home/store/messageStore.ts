import { acceptHMRUpdate, defineStore } from 'pinia'
import { store } from '@/store'

import {
  IM_AT_ALL_USER_ID,
  ImConversationType,
  ImMessageStatus,
  ImMessageType,
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
  type DbTx
} from '../../utils/db'
import {
  generateClientMessageId,
  parseRecallMessageId,
  revokeBlobUrlsInContent
} from '../../utils/message'
import { resolveConversationLastContent } from '../../utils/conversation'
import { getCurrentUserId } from '../../utils/storage'
import { tryGetSenderDisplayName } from '../../utils/user'
import { useGroupStore } from './groupStore'
import { useConversationStore } from './conversationStore'
import type { Conversation, Message, MessageDO } from '../types'

const MESSAGE_CACHE_CONVERSATION_LIMIT = 5
const ackMergingPromises = new Map<string, Promise<void>>()

interface MessageConversationInfo {
  type: number
  targetId: number
  name: string
  avatar: string
  silent?: boolean
}

// TODO @AI：叫这个 type 有点奇怪，可能需要再考虑下。
export type PulledMessageBatchItem =
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
// TODO @AI：buildXXX 更合理。
function toMessageDO(message: Message, conversationType: number): MessageDO {
  const {
    uploadProgress: _uploadProgress,
    _localFile: _localFile,
    _ackMerging: _ackMerging,
    ...rest
  } = message
  return {
    ...rest,
    messageKey: getMessageKey(message, conversationType),
    conversationType,
    clientConversationId: getClientConversationId(conversationType, message.targetId)
  }
}

/** IndexedDB 消息记录转前端消息 */
// TODO @AI：buildXXX 更合理。
function fromMessageDO(message: MessageDO): Message {
  const {
    messageKey: _messageKey,
    conversationType: _conversationType,
    clientConversationId: _clientConversationId,
    ...rest
  } = message
  return rest
}

/** 算出末条消息的发送人快照 */
// TODO @AI：里面的代码注释；最好写下；
function deriveLastSenderDisplayName(
  conversation: Conversation,
  senderId: number
): string | undefined {
  const liveSenderName = tryGetSenderDisplayName(senderId, conversation.type, conversation.targetId)
  if (liveSenderName) {
    return liveSenderName
  }
  if (conversation.type === ImConversationType.GROUP) {
    const groupStore = useGroupStore()
    const group = groupStore.getGroup(conversation.targetId)
    const fetchPromise = group?.membersLoaded
      ? groupStore.fetchGroupMember(conversation.targetId, senderId)
      : groupStore.fetchGroupMembers(conversation.targetId)
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
    message.atUserIds.length === 0 ||
    message.status === ImMessageStatus.READ
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
      this.privateMessageMaxId = 0
      this.groupMessageMaxId = 0
      this.channelMessageMaxId = 0
      ackMergingPromises.clear()
    },

    /** 从 settings 加载消息游标 */
    async loadCursors() {
      const db = getDb()
      // TODO @AI：可以通过 message 表去算么？不通过这个。
      const [privateMaxId, groupMaxId, channelMaxId] = await Promise.all([
        db.getSetting<number>('privateMessageMaxId'),
        db.getSetting<number>('groupMessageMaxId'),
        db.getSetting<number>('channelMessageMaxId')
      ])
      this.privateMessageMaxId = privateMaxId || 0
      this.groupMessageMaxId = groupMaxId || 0
      this.channelMessageMaxId = channelMaxId || 0
    },

    /** 更新内存游标 */
    updateMaxId(conversationType: number, messageId?: number) {
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

    /** 标记会话近期使用 */
    touchConversation(clientConversationId: string) {
      this.loadedConversationKeys = [
        clientConversationId,
        ...this.loadedConversationKeys.filter((key) => key !== clientConversationId)
      ]
      // 保留当前活跃会话 + 最近打开过的 5 个会话。
      const retained = this.loadedConversationKeys.slice(0, MESSAGE_CACHE_CONVERSATION_LIMIT + 1)
      const removed = this.loadedConversationKeys.slice(MESSAGE_CACHE_CONVERSATION_LIMIT + 1)
      this.loadedConversationKeys = retained
      removed.forEach((key) => {
        delete this.messagesByConversation[key]
      })
    },

    /** 加载当前会话最近消息 */
    async loadMore(
      clientConversationId: string,
      beforeSendTime?: number,
      limit = 50
    ): Promise<Message[]> {
      // TODO @AI：代码段的注释；
      const list = await getDb().getMessagesByConversation(clientConversationId, {
        beforeSendTime,
        limit
      })
      const parsed = parseClientConversationId(clientConversationId)
      if (!parsed) {
        return []
      }
      const messages = list.map(fromMessageDO)
      const existing = this.messagesByConversation[clientConversationId] || []
      const existingKeys = new Set(existing.map((message) => getMessageKey(message, parsed.type)))
      const fresh = messages.filter(
        (message) => !existingKeys.has(getMessageKey(message, parsed.type))
      )
      // TODO @AI：messageA、messageB；
      this.messagesByConversation[clientConversationId] = [...fresh, ...existing].sort(
        (a, b) => (a.sendTime || 0) - (b.sendTime || 0)
      )
      this.touchConversation(clientConversationId)
      return fresh
    },

    /** 确保会话消息已加载 */
    async ensureLoaded(conversation: Conversation) {
      // TODO @AI：代码段的注释；
      const key = getMessageCacheKey(conversation.type, conversation.targetId)
      if (this.messagesByConversation[key]) {
        this.touchConversation(key)
        return
      }
      await this.loadMore(key)
    },

    /** 获取内存消息数组 */
    getMessageList(conversationType: number, targetId: number): Message[] {
      // TODO @AI：代码段的注释；
      const key = getMessageCacheKey(conversationType, targetId)
      if (!this.messagesByConversation[key]) {
        this.messagesByConversation[key] = []
      }
      this.touchConversation(key)
      return this.messagesByConversation[key]
    },

    /** 持久化单条消息 */
    async persistMessage(message: Message, conversationType: number, tx?: DbTx) {
      // TODO @AI：代码段的注释；
      const db = getDb()
      const next = toMessageDO(message, conversationType)
      if (message.id && message.clientMessageId) {
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

    /** 持久化消息游标 */
    async persistMaxId(conversationType: number, messageId?: number, tx?: DbTx) {
      this.updateMaxId(conversationType, messageId)
      await setMessageMaxId(conversationType, messageId, tx)
    },

    /** 应用撤回到内存 */
    applyRecallInMemory(conversationType: number, targetId: number, recallSignalContent: string) {
      // TODO @AI：代码段的注释；
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
      message.type = ImMessageType.RECALL
      message.status = ImMessageStatus.RECALL
      message.content = ''
      if (messages[messages.length - 1]?.id === messageId) {
        recomputeConversationLast(conversation, messages)
      }
      return { conversation, message }
    },

    /** 批量写入拉取消息 */
    async insertPulledBatch(
      items: PulledMessageBatchItem[],
      conversationType: number,
      maxMessageId?: number
    ) {
      // TODO @AI：代码段的注释；
      if (items.length === 0) {
        await this.persistMaxId(conversationType, maxMessageId)
        return
      }
      const conversationStore = useConversationStore()
      const persistedMessages = new Map<string, { message: Message; conversationType: number }>()
      const changedConversations = new Map<string, Conversation>()

      const addChanged = (conversation: Conversation, message: Message) => {
        const clientConversationId = getClientConversationId(
          conversation.type,
          conversation.targetId
        )
        changedConversations.set(clientConversationId, conversation)
        persistedMessages.set(getMessageKey(message, conversation.type), {
          message,
          conversationType: conversation.type
        })
      }

      // TODO @AI：是不是最好 mesages？
      for (const item of items) {
        if (item.kind === 'recall') {
          const changed = this.applyRecallInMemory(
            item.conversationType,
            item.targetId,
            item.recallSignalContent
          )
          if (changed) {
            addChanged(changed.conversation, changed.message)
          }
          continue
        }

        const { conversationInfo } = item
        const message = ensureClientMessageId(item.message)
        if (
          conversationInfo.type === ImConversationType.GROUP &&
          isGroupNotification(message.type)
        ) {
          useGroupStore().applyGroupNotification(
            conversationInfo.targetId,
            message.type,
            message.content
          )
        }

        const conversation = conversationStore.ensureConversation(conversationInfo)
        const messages = this.getMessageList(conversationInfo.type, conversationInfo.targetId)
        const existingIndex = messages.findIndex((existing) => isSameMessage(existing, message))
        if (existingIndex >= 0) {
          applyServerMessageUpdate(messages[existingIndex], message)
          if (existingIndex === messages.length - 1) {
            recomputeConversationLast(conversation, messages)
            syncConversationAtFlags(conversation, message)
          }
          this.updateMaxId(conversationInfo.type, message.id)
          addChanged(conversation, messages[existingIndex])
          continue
        }

        // TODO @AI：applyConversationSummary 要 await 么？不然会有报错；
        applyConversationSummary(conversation, message)
        syncConversationAtFlags(conversation, message)
        const isActive =
          conversationStore.activeConversation?.type === conversationInfo.type &&
          conversationStore.activeConversation?.targetId === conversationInfo.targetId
        if (
          !message.selfSend &&
          !isActive &&
          isNormalMessage(message.type) &&
          message.status !== ImMessageStatus.READ &&
          message.status !== ImMessageStatus.RECALL
        ) {
          conversation.unreadCount++
        }

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
        this.updateMaxId(conversationInfo.type, message.id)
        addChanged(conversation, message)
      }

      this.updateMaxId(conversationType, maxMessageId)
      await getDb()
        .transaction(['messages', 'conversations', 'settings'], 'readwrite', async (tx) => {
          for (const item of persistedMessages.values()) {
            await this.persistMessage(item.message, item.conversationType, tx)
          }
          await conversationStore.persistConversations([...changedConversations.values()], tx)
          await setMessageMaxId(conversationType, maxMessageId, tx)
        })
        .catch((e) => console.error('[IM messageStore] 批量消息写入失败', e))
    },

    /** 插入消息 */
    insertMessage(
      conversationInfo: MessageConversationInfo,
      messageInfo: Message,
      options?: { persistMaxId?: boolean }
    ) {
      // TODO @AI：代码段的注释；类似上面的问题；；；
      const conversationStore = useConversationStore()
      const message = ensureClientMessageId(messageInfo)
      if (conversationInfo.type === ImConversationType.GROUP && isGroupNotification(message.type)) {
        useGroupStore().applyGroupNotification(
          conversationInfo.targetId,
          message.type,
          message.content
        )
      }

      const conversation = conversationStore.ensureConversation(conversationInfo)
      const messages = this.getMessageList(conversationInfo.type, conversationInfo.targetId)
      const existingIndex = messages.findIndex((item) => isSameMessage(item, message))
      if (existingIndex >= 0) {
        applyServerMessageUpdate(messages[existingIndex], message)
        if (existingIndex === messages.length - 1) {
          recomputeConversationLast(conversation, messages)
          syncConversationAtFlags(conversation, message)
        }
        this.updateMaxId(conversationInfo.type, message.id)
        void getDb()
          .transaction(['messages', 'conversations', 'settings'], 'readwrite', async (tx) => {
            await this.persistMessage(messages[existingIndex], conversationInfo.type, tx)
            await conversationStore.persistConversations(conversation, tx)
            if (options?.persistMaxId !== false) {
              await setMessageMaxId(conversationInfo.type, message.id, tx)
            }
          })
          .catch((e) => console.error('[IM messageStore] 消息写入失败', e))
        return
      }

      applyConversationSummary(conversation, message)
      syncConversationAtFlags(conversation, message)

      const isActive =
        conversationStore.activeConversation?.type === conversationInfo.type &&
        conversationStore.activeConversation?.targetId === conversationInfo.targetId
      if (
        !message.selfSend &&
        !isActive &&
        isNormalMessage(message.type) &&
        message.status !== ImMessageStatus.READ &&
        message.status !== ImMessageStatus.RECALL
      ) {
        conversation.unreadCount++
      }

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
      this.updateMaxId(conversationInfo.type, message.id)
      void getDb()
        .transaction(['messages', 'conversations', 'settings'], 'readwrite', async (tx) => {
          await this.persistMessage(message, conversationInfo.type, tx)
          await conversationStore.persistConversations(conversation, tx)
          if (options?.persistMaxId !== false) {
            await setMessageMaxId(conversationInfo.type, message.id, tx)
          }
        })
        .catch((e) => console.error('[IM messageStore] 消息写入失败', e))
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
        applyServerMessageUpdate(message, updates)
        if (messages[messages.length - 1] === message) {
          recomputeConversationLast(conversation, messages)
        }
        this.updateMaxId(conversationType, message.id)
        await getDb()
          .transaction(['messages', 'conversations', 'settings'], 'readwrite', async (tx) => {
            await this.persistMessage(message, conversationType, tx)
            await conversationStore.persistConversations(conversation, tx)
            await setMessageMaxId(conversationType, message.id, tx)
          })
          .catch((e) => console.error('[IM messageStore] ack 写入失败', e))
      } finally {
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
      // TODO @AI：代码段的注释；
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
    recallMessage(conversationType: number, targetId: number, recallSignalContent: string) {
      const conversationStore = useConversationStore()
      const changed = this.applyRecallInMemory(conversationType, targetId, recallSignalContent)
      if (!changed) {
        return
      }
      this.persistMessage(changed.message, conversationType).catch((e) =>
        console.error('[IM messageStore] 撤回消息写入失败', e)
      )
      conversationStore.saveConversations(changed.conversation)
    },

    /** 应用已读回执 */
    applyReadReceipt(options: {
      conversationType: number
      targetId: number
      privateReadMaxId?: number
      groupMessageId?: number
      readCount?: number
      receiptStatus?: number
    }) {
      // TODO @AI：代码段的注释；
      const messages = this.getMessageList(options.conversationType, options.targetId)
      const changed: Message[] = []
      if (options.conversationType === ImConversationType.PRIVATE && options.privateReadMaxId) {
        messages.forEach((message) => {
          if (
            message.selfSend &&
            message.id &&
            message.id <= options.privateReadMaxId! &&
            message.status !== ImMessageStatus.RECALL
          ) {
            message.status = ImMessageStatus.READ
            changed.push(message)
          }
        })
      } else if (options.conversationType === ImConversationType.GROUP && options.groupMessageId) {
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
      changed.forEach((message) => {
        this.persistMessage(message, options.conversationType).catch((e) =>
          console.warn('[IM messageStore] 回执写入失败', e)
        )
      })
    },

    /** 前置历史消息 */
    prependMessages(conversationType: number, targetId: number, earlierMessages: Message[]) {
      // TODO @AI：代码段的注释；
      if (earlierMessages.length === 0) {
        return
      }
      const messages = this.getMessageList(conversationType, targetId)
      const existingIds = new Set(messages.map((message) => message.id).filter(Boolean))
      const fresh = earlierMessages
        .map(ensureClientMessageId)
        .filter((message) => message.id && !existingIds.has(message.id))
        .sort((a, b) => (a.id || 0) - (b.id || 0))
      if (fresh.length === 0) {
        return
      }
      const key = getMessageCacheKey(conversationType, targetId)
      this.messagesByConversation[key] = [...fresh, ...messages]
      fresh.forEach((message) => {
        this.persistMessage(message, conversationType).catch((e) =>
          console.warn('[IM messageStore] 历史消息写入失败', e)
        )
      })
    },

    /** 删除单条消息 */
    removeMessage(
      conversationType: number,
      targetId: number,
      key: { id?: number; clientMessageId?: string }
    ) {
      // TODO @AI：代码段的注释；
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
      const [removed] = messages.splice(index, 1)
      revokeBlobUrlsInContent(removed.content)
      if (index === messages.length) {
        recomputeConversationLast(conversation, messages)
      }
      getDb()
        .delete('messages', getMessageKey(removed, conversationType))
        .catch((e) => console.warn('[IM messageStore] 消息删除失败', e))
      conversationStore.saveConversations()
    },

    /** 当前会话标记已读 */
    markConversationMessagesRead(conversation: Conversation) {
      // TODO @AI：代码段的注释；
      const messages = this.getMessageList(conversation.type, conversation.targetId)
      messages.forEach((message) => {
        if (!message.selfSend && message.status === ImMessageStatus.UNREAD) {
          message.status = ImMessageStatus.READ
          this.persistMessage(message, conversation.type).catch((e) =>
            console.warn('[IM messageStore] 已读状态写入失败', e)
          )
        }
      })
    },

    /** 删除会话全部消息 */
    deleteConversationMessages(conversationType: number, targetId: number) {
      // TODO @AI：代码段的注释；
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
