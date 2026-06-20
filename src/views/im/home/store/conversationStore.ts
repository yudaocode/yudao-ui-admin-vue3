import { acceptHMRUpdate, defineStore } from 'pinia'
import { debounce } from 'lodash-es'
import { store } from '@/store'

import { CONVERSATION_RECENT_FORWARD_MAX } from '../../utils/config'
import {
  ImConversationType,
  ImMessageReceiptStatus,
  ImMessageStatus,
  isNormalMessage
} from '../../utils/constants'
import { getClientConversationId, getDb, StorageKeys, type DbTransaction } from '../../utils/db'
import { runIncrementalPull } from '../../utils/pull'
import { getCurrentUserId } from '@/utils/auth'
import { useMessageStore } from './messageStore'
import {
  pullMyConversationReadList as apiPullMyConversationReadList,
  type ImConversationReadRespVO
} from '@/api/im/conversation/read'
import type {
  Conversation,
  ConversationDO,
  ConversationRead,
  ConversationReadDO,
  MessageDO
} from '../types'

const PERSIST_DRAFT_DEBOUNCE_MS = 500
const pendingDraftConversations = new Set<Conversation>()

/** 创建会话读位置记录 */
function createConversationRead(
  type: number,
  targetId: number,
  messageId: number
): ConversationRead {
  return {
    conversationType: type,
    targetId,
    messageId,
    updateTime: Date.now()
  }
}

/** 会话转 IndexedDB 记录 */
function toConversationDO(conversation: Conversation): ConversationDO {
  const draft = conversation.draft
  return {
    targetId: conversation.targetId,
    type: conversation.type,
    name: conversation.name,
    avatar: conversation.avatar,
    unreadCount: conversation.unreadCount,
    lastContent: conversation.lastContent,
    lastSendTime: conversation.lastSendTime,
    lastSenderId: conversation.lastSenderId,
    lastMessageType: conversation.lastMessageType,
    lastMessageId: conversation.lastMessageId,
    lastClientMessageId: conversation.lastClientMessageId,
    lastMessageStatus: conversation.lastMessageStatus,
    lastReceiptStatus: conversation.lastReceiptStatus,
    lastSelfSend: conversation.lastSelfSend,
    lastSenderDisplayName: conversation.lastSenderDisplayName,
    reportedReadMessageId: conversation.reportedReadMessageId,
    deleted: conversation.deleted,
    top: conversation.top,
    silent: conversation.silent,
    atMe: conversation.atMe,
    atAll: conversation.atAll,
    draft: draft ? { ...draft, reply: draft.reply ? { ...draft.reply } : undefined } : undefined,
    clientConversationId: getClientConversationId(conversation.type, conversation.targetId)
  }
}

/** IndexedDB 记录转会话 */
function fromConversationDO(conversation: ConversationDO): Conversation {
  const { clientConversationId: _clientConversationId, ...rest } = conversation
  return rest
}

/** 会话读位置转 IndexedDB 记录 */
function toConversationReadDO(record: ConversationRead): ConversationReadDO {
  return {
    conversationType: record.conversationType,
    targetId: record.targetId,
    messageId: record.messageId,
    updateTime: record.updateTime,
    clientConversationId: getClientConversationId(record.conversationType, record.targetId)
  }
}

/** IndexedDB 记录转会话读位置 */
function fromConversationReadDO(record: ConversationReadDO): ConversationRead {
  const { clientConversationId: _clientConversationId, ...rest } = record
  return rest
}

/** 是否为有效会话读位置 */
function isValidConversationReadRecord(record: ImConversationReadRespVO): boolean {
  return !!record.conversationType && !!record.targetId && !!record.messageId
}

/** 获取对方普通消息最大编号 */
function getMaxIncomingNormalMessageId(
  messages: Array<Pick<MessageDO, 'id' | 'selfSend' | 'type' | 'status'>>
): number {
  return messages.reduce((maxMessageId, message) => {
    if (
      message.id &&
      !message.selfSend &&
      isNormalMessage(message.type) &&
      message.status !== ImMessageStatus.RECALL &&
      message.id > maxMessageId
    ) {
      return message.id
    }
    return maxMessageId
  }, 0)
}

export const useConversationStore = defineStore('imConversationStore', {
  state: () => ({
    conversations: [] as Conversation[], // 全量会话列表（私聊 + 群聊 + 频道）
    conversationReads: {} as Record<string, ConversationRead>, // 会话读位置
    activeConversation: null as Conversation | null, // 当前激活的会话
    loading: false, // 是否正在批量加载
    recentForwardConversationKeys: [] as string[] // 最近转发会话 key 列表
  }),

  getters: {
    /** 排序后的会话列表 */
    getSortedConversationList(state): Conversation[] {
      return [...state.conversations]
        .filter((conversation) => !conversation.deleted)
        .sort((a, b) => {
          const aTop = a.top ? 1 : 0
          const bTop = b.top ? 1 : 0
          if (aTop !== bTop) {
            return bTop - aTop
          }
          return (b.lastSendTime || 0) - (a.lastSendTime || 0)
        })
    },

    /** 未读总数 */
    getTotalUnreadCount(state): number {
      return state.conversations
        .filter((conversation) => !conversation.deleted && !conversation.silent)
        .reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0)
    },

    /** 查找会话 */
    getConversation:
      (state) =>
      (type: number, targetId: number): Conversation | undefined =>
        state.conversations.find(
          (conversation) => conversation.type === type && conversation.targetId === targetId
        ),

    /** 查找会话读位置 */
    getConversationRead:
      (state) =>
      (type: number, targetId: number): ConversationRead | undefined =>
        state.conversationReads[getClientConversationId(type, targetId)]
  },

  actions: {
    /** 加载会话 */
    async loadConversationList() {
      // 1. 清理旧账号内存
      const userId = getCurrentUserId()
      if (!userId) {
        this.clear()
        return
      }
      const previousActiveKey = this.activeConversation
        ? getClientConversationId(this.activeConversation.type, this.activeConversation.targetId)
        : null
      this.clear()
      // 2. 从 IndexedDB 读取会话和轻量设置
      const db = getDb()
      const [conversations, conversationReads, recent] = await Promise.all([
        db.getAll<ConversationDO>('conversations'),
        db.getAll<ConversationReadDO>('conversationReads'),
        db.getSetting<string[]>(StorageKeys.settings.recentForwardConversationKeys)
      ])
      const nextConversationReads: Record<string, ConversationRead> = {}
      for (const record of conversationReads) {
        const item = fromConversationReadDO(record)
        nextConversationReads[getClientConversationId(item.conversationType, item.targetId)] = item
      }
      const nextConversations = conversations.map(fromConversationDO)
      this.conversationReads = nextConversationReads
      await this.applyLocalConversationReads(nextConversations)
      this.conversations = nextConversations
      if (Array.isArray(recent)) {
        this.recentForwardConversationKeys = recent.slice(0, CONVERSATION_RECENT_FORWARD_MAX)
      }
      // 3. 恢复当前激活会话
      if (previousActiveKey) {
        this.activeConversation =
          this.conversations.find(
            (conversation) =>
              !conversation.deleted &&
              getClientConversationId(conversation.type, conversation.targetId) ===
                previousActiveKey
          ) ?? null
      }
    },

    /** 清空会话内存 */
    clear() {
      saveDraftConversationListDebounced.cancel()
      pendingDraftConversations.clear()
      this.conversations = []
      this.conversationReads = {}
      this.activeConversation = null
      this.recentForwardConversationKeys = []
    },

    /** 持久化会话读位置 */
    async saveConversationReadRecord(
      target: ConversationRead | ConversationRead[] | null | undefined,
      tx?: DbTransaction
    ): Promise<void> {
      const records = (Array.isArray(target) ? target : target ? [target] : []).map(
        toConversationReadDO
      )
      if (records.length === 0) {
        return
      }
      const db = getDb()
      if (tx) {
        for (const record of records) {
          await db.put('conversationReads', record, tx)
        }
        return
      }
      await db.transaction(['conversationReads'], 'readwrite', async (tx) => {
        for (const record of records) {
          await db.put('conversationReads', record, tx)
        }
      })
    },

    /** 应用本地会话读位置 */
    async applyLocalConversationReads(conversations?: Conversation[]) {
      const targetConversations = conversations || this.conversations
      const changedConversations: Conversation[] = []
      for (const conversation of targetConversations) {
        const record = this.getConversationRead(conversation.type, conversation.targetId)
        if (!record) {
          continue
        }
        if (this.applyReadToConversation(conversation, record.messageId)) {
          changedConversations.push(conversation)
          continue
        }
        if (conversation.unreadCount === 0 && !conversation.atMe && !conversation.atAll) {
          continue
        }
        const messages = await getDb().getAllByIndex<MessageDO>(
          'messages',
          'clientConversationId',
          getClientConversationId(conversation.type, conversation.targetId)
        )
        const maxIncomingMessageId = getMaxIncomingNormalMessageId(messages)
        if (maxIncomingMessageId > 0 && maxIncomingMessageId <= record.messageId) {
          conversation.unreadCount = 0
          conversation.atMe = false
          conversation.atAll = false
          changedConversations.push(conversation)
        }
      }
      if (changedConversations.length > 0) {
        await this.saveConversationRecord(changedConversations)
      }
    },

    /** 判断消息是否已被会话读位置覆盖 */
    isMessageCoveredByReadPosition(
      conversation: Pick<Conversation, 'type' | 'targetId'>,
      message?: { id?: number } | null
    ): boolean {
      if (!message?.id) {
        return false
      }
      const record = this.getConversationRead(conversation.type, conversation.targetId)
      return !!record && message.id <= record.messageId
    },

    /** 判断会话读位置是否覆盖消息编号 */
    isReadPositionCovered(type: number, targetId: number, messageId?: number): boolean {
      if (!messageId) {
        return false
      }
      const record = this.getConversationRead(type, targetId)
      return !!record && record.messageId >= messageId
    },

    /** 判断服务端已读位置是否覆盖消息编号 */
    isReportedReadPositionCovered(type: number, targetId: number, messageId?: number): boolean {
      if (!messageId) {
        return false
      }
      const conversation = this.getConversation(type, targetId)
      return (conversation?.reportedReadMessageId || 0) >= messageId
    },

    /** 应用读位置到会话 */
    applyReadToConversation(conversation: Conversation, messageId: number): boolean {
      if (!conversation.lastMessageId || conversation.lastMessageId > messageId) {
        return false
      }
      if (conversation.unreadCount === 0 && !conversation.atMe && !conversation.atAll) {
        return false
      }
      conversation.unreadCount = 0
      conversation.atMe = false
      conversation.atAll = false
      return true
    },

    /** 应用会话读位置 */
    async applyConversationReadList(
      records: ImConversationReadRespVO[],
      isActive?: () => boolean
    ): Promise<void> {
      if (records.length === 0) {
        return
      }
      const changedReads = new Map<string, ConversationRead>()
      const changedConversations = new Map<string, Conversation>()
      const changedMessages = new Map<string, MessageDO>()
      const db = getDb()
      const messageStore = useMessageStore()

      // 1. 按读位置更新会话未读和频道已读态
      for (const record of records) {
        if (isActive && !isActive()) {
          return
        }
        if (!isValidConversationReadRecord(record)) {
          continue
        }
        const clientConversationId = getClientConversationId(
          record.conversationType,
          record.targetId
        )
        let storedMessages: MessageDO[] | undefined
        const getStoredMessages = async () => {
          if (!storedMessages) {
            storedMessages = await db.getAllByIndex<MessageDO>(
              'messages',
              'clientConversationId',
              clientConversationId
            )
          }
          return storedMessages
        }
        const current = this.conversationReads[clientConversationId]
        const messageId = Math.max(record.messageId, current?.messageId || 0)
        const conversation = this.getConversation(record.conversationType, record.targetId)
        if (conversation && record.messageId > (conversation.reportedReadMessageId || 0)) {
          conversation.reportedReadMessageId = record.messageId
          changedConversations.set(clientConversationId, conversation)
        }
        if (!current || messageId > current.messageId) {
          const next = {
            conversationType: record.conversationType,
            targetId: record.targetId,
            messageId,
            updateTime: record.updateTime
          }
          this.conversationReads[clientConversationId] = next
          changedReads.set(clientConversationId, next)
        }

        if (conversation && this.applyReadToConversation(conversation, messageId)) {
          changedConversations.set(clientConversationId, conversation)
        } else if (conversation) {
          const maxIncomingMessageId = getMaxIncomingNormalMessageId(await getStoredMessages())
          if (maxIncomingMessageId > 0 && maxIncomingMessageId <= messageId) {
            conversation.unreadCount = 0
            conversation.atMe = false
            conversation.atAll = false
            changedConversations.set(clientConversationId, conversation)
          }
        }
        if (record.conversationType !== ImConversationType.CHANNEL) {
          continue
        }
        const memoryMessages = messageStore.getMessages(clientConversationId)
        for (const message of memoryMessages) {
          if (
            message.id &&
            message.id <= messageId &&
            message.receiptStatus !== ImMessageReceiptStatus.DONE
          ) {
            message.receiptStatus = ImMessageReceiptStatus.DONE
          }
        }
        for (const message of await getStoredMessages()) {
          if (
            message.id &&
            message.id <= messageId &&
            message.receiptStatus !== ImMessageReceiptStatus.DONE
          ) {
            message.receiptStatus = ImMessageReceiptStatus.DONE
            changedMessages.set(message.messageKey, message)
          }
        }
      }

      // 2. 持久化本轮变更
      if (
        changedReads.size === 0 &&
        changedConversations.size === 0 &&
        changedMessages.size === 0
      ) {
        return
      }
      if (isActive && !isActive()) {
        return
      }
      const stores: Array<'conversationReads' | 'conversations' | 'messages'> = []
      if (changedReads.size > 0) {
        stores.push('conversationReads')
      }
      if (changedConversations.size > 0) {
        stores.push('conversations')
      }
      if (changedMessages.size > 0) {
        stores.push('messages')
      }
      await db.transaction(stores, 'readwrite', async (tx) => {
        if (changedReads.size > 0) {
          await this.saveConversationReadRecord([...changedReads.values()], tx)
        }
        if (changedConversations.size > 0) {
          await this.saveConversationRecord([...changedConversations.values()], tx)
        }
        for (const message of changedMessages.values()) {
          await db.put('messages', message, tx)
        }
      })
    },

    /** 增量拉取会话读位置 */
    async pullConversationReads(isActive?: () => boolean): Promise<void> {
      await runIncrementalPull(
        StorageKeys.settings.conversationReadPullCursor,
        apiPullMyConversationReadList,
        async (records) => {
          if (isActive && !isActive()) {
            return false
          }
          await this.applyConversationReadList(records, isActive)
          if (isActive && !isActive()) {
            return false
          }
          return true
        },
        isActive
      )
    },

    /** 执行会话记录持久化 */
    async saveConversationRecord(
      target: Conversation | Conversation[] | null | undefined,
      tx?: DbTransaction
    ): Promise<void> {
      const db = getDb()
      const conversations = (Array.isArray(target) ? target : target ? [target] : []).map(
        toConversationDO
      )
      if (conversations.length === 0) {
        return
      }
      if (tx) {
        for (const conversation of conversations) {
          await db.put('conversations', conversation, tx)
        }
        return
      }
      await db.transaction(['conversations'], 'readwrite', async (tx) => {
        for (const conversation of conversations) {
          await db.put('conversations', conversation, tx)
        }
      })
    },

    /** 持久化单个会话 */
    saveConversation(conversation: Conversation | null | undefined, tx?: DbTransaction): void {
      if (!conversation) {
        return
      }
      void this.saveConversationRecord(conversation, tx).catch((e) =>
        console.warn('[IM conversationStore] 会话写入失败', e)
      )
    },

    /** 持久化会话列表 */
    saveConversationList(conversations?: Conversation[] | null, tx?: DbTransaction): void {
      if (this.loading && !tx) {
        return
      }
      void this.saveConversationRecord(conversations || this.conversations, tx).catch((e) =>
        console.warn('[IM conversationStore] 会话写入失败', e)
      )
    },

    /** 确保会话存在 */
    ensureConversation(info: {
      type: number
      targetId: number
      name: string
      avatar: string
      silent?: boolean
    }): Conversation {
      // 1. 创建不存在的会话
      let conversation = this.getConversation(info.type, info.targetId)
      if (!conversation) {
        conversation = this.createEmptyConversation(
          info.type,
          info.targetId,
          info.name,
          info.avatar,
          info.silent
        )
        this.conversations.unshift(conversation)
      } else if (conversation.deleted) {
        // 2. 恢复软删除会话
        conversation.deleted = false
        conversation.name = info.name || conversation.name
        conversation.avatar = info.avatar || conversation.avatar
        if (info.silent !== undefined) {
          conversation.silent = info.silent
        }
      } else {
        // 3. 同步会话展示元数据
        if (info.name) {
          conversation.name = info.name
        }
        if (info.avatar) {
          conversation.avatar = info.avatar
        }
        if (info.silent !== undefined) {
          conversation.silent = info.silent
        }
      }
      return conversation
    },

    /** 打开或创建会话 */
    openConversation(
      targetId: number,
      type: number,
      name: string,
      avatar: string,
      options?: { silent?: boolean }
    ): Conversation {
      // 1. 确保会话在列表中
      const conversation = this.ensureConversation({
        type,
        targetId,
        name,
        avatar,
        silent: options?.silent
      })
      // 2. 激活会话并保存
      this.setActiveConversation(conversation)
      this.saveConversation(conversation)
      return conversation
    },

    /** 设置当前会话 */
    setActiveConversation(conversation: Conversation | null) {
      this.activeConversation = conversation
      if (!conversation) {
        return
      }
      // 懒加载消息并保存会话摘要
      void useMessageStore().ensureConversationMessageListLoaded(conversation)
      this.saveConversation(conversation)
    },

    /** 创建空会话 */
    createEmptyConversation(
      type: number,
      targetId: number,
      name: string,
      avatar: string,
      silent = false
    ): Conversation {
      return {
        targetId,
        type,
        name,
        avatar,
        lastContent: '',
        lastSendTime: 0,
        unreadCount: 0,
        deleted: false,
        top: false,
        silent,
        atMe: false,
        atAll: false
      }
    },

    /** 设置置顶 */
    setConversationTop(type: number, targetId: number, top: boolean) {
      const conversation = this.getConversation(type, targetId)
      if (!conversation) {
        return
      }
      conversation.top = top
      this.saveConversation(conversation)
    },

    /** 设置免打扰 */
    setConversationSilent(type: number, targetId: number, silent: boolean) {
      const conversation = this.getConversation(type, targetId)
      if (!conversation) {
        return
      }
      conversation.silent = silent
      this.saveConversation(conversation)
    },

    /** 删除会话 */
    removeConversation(type: number, targetId: number) {
      // 1. 标记会话删除
      const conversation = this.getConversation(type, targetId)
      if (!conversation) {
        return
      }
      if (this.activeConversation === conversation) {
        this.activeConversation = null
      }
      conversation.deleted = true
      // 2. 删除会话关联的消息和草稿
      useMessageStore().deleteConversationMessageList(type, targetId)
      this.clearConversationDraft(conversation)
      this.saveConversation(conversation)
    },

    /** 删除私聊会话 */
    removePrivateConversation(friendId: number) {
      this.removeConversation(ImConversationType.PRIVATE, friendId)
    },

    /** 删除群聊会话 */
    removeGroupConversation(groupId: number) {
      this.removeConversation(ImConversationType.GROUP, groupId)
    },

    /** 标记会话已读 */
    markConversationRead(type: number, targetId: number, messageId?: number): void {
      const conversation = this.getConversation(type, targetId)
      if (!conversation) {
        return
      }
      const key = getClientConversationId(type, targetId)
      const current = this.conversationReads[key]
      const readMessageIdAdvanced = !!messageId && messageId > (current?.messageId || 0)
      if (
        conversation.unreadCount === 0 &&
        !conversation.atMe &&
        !conversation.atAll &&
        !readMessageIdAdvanced
      ) {
        return
      }
      conversation.unreadCount = 0
      conversation.atMe = false
      conversation.atAll = false
      if (readMessageIdAdvanced) {
        const record = createConversationRead(type, targetId, messageId)
        this.conversationReads[key] = record
        void getDb()
          .transaction(['conversations', 'conversationReads'], 'readwrite', async (tx) => {
            await this.saveConversationRecord(conversation, tx)
            await this.saveConversationReadRecord(record, tx)
          })
          .catch((e) =>
            console.warn(
              '[IM conversationStore] 会话已读写入失败',
              {
                conversationType: type,
                targetId,
                messageId,
                conversationKey: key
              },
              e
            )
          )
        return
      }
      this.saveConversation(conversation)
    },

    /** 标记会话已上报服务端读位置 */
    markConversationReadReported(type: number, targetId: number, messageId?: number): void {
      if (!messageId) {
        return
      }
      const conversation = this.getConversation(type, targetId)
      if (!conversation || messageId <= (conversation.reportedReadMessageId || 0)) {
        return
      }
      conversation.reportedReadMessageId = messageId
      this.saveConversation(conversation)
    },

    // ==================== 最近转发 ====================

    /** 推送最近转发会话 */
    pushRecentForwardConversationKeyList(keys: string[]) {
      if (!keys || keys.length === 0) {
        return
      }
      const merged = [...keys, ...this.recentForwardConversationKeys]
      this.recentForwardConversationKeys = Array.from(new Set(merged)).slice(
        0,
        CONVERSATION_RECENT_FORWARD_MAX
      )
      this.saveRecentForwardConversationKeyList()
    },

    /** 移除最近转发会话 */
    removeRecentForwardConversationKey(key: string) {
      const index = this.recentForwardConversationKeys.indexOf(key)
      if (index < 0) {
        return
      }
      this.recentForwardConversationKeys.splice(index, 1)
      this.saveRecentForwardConversationKeyList()
    },

    /** 保存最近转发会话 */
    saveRecentForwardConversationKeyList() {
      void getDb()
        .setSetting(
          StorageKeys.settings.recentForwardConversationKeys,
          this.recentForwardConversationKeys.slice(0, CONVERSATION_RECENT_FORWARD_MAX)
        )
        .catch((e) => console.warn('[IM conversationStore] 最近转发列表写入失败', e))
    },

    // ==================== 会话维护 ====================

    /** 重排会话 */
    sortConversationList() {
      this.conversations.sort((a, b) => (b.lastSendTime || 0) - (a.lastSendTime || 0))
      this.saveConversationList(this.conversations)
    },

    /** 同步会话展示元数据 */
    updateConversation(
      type: number,
      targetId: number,
      info: { name?: string; avatar?: string; silent?: boolean }
    ) {
      const conversation = this.getConversation(type, targetId)
      if (!conversation) {
        return
      }
      let changed = false
      if (info.name && conversation.name !== info.name) {
        conversation.name = info.name
        changed = true
      }
      if (info.avatar !== undefined && conversation.avatar !== info.avatar) {
        conversation.avatar = info.avatar || ''
        changed = true
      }
      if (info.silent !== undefined && conversation.silent !== info.silent) {
        conversation.silent = info.silent
        changed = true
      }
      if (changed) {
        this.saveConversation(conversation)
      }
    },

    // ==================== 草稿 ====================

    /** 获取草稿 */
    getConversationDraft(conversation: {
      type: number
      targetId: number
    }): Conversation['draft'] | undefined {
      return this.getConversation(conversation.type, conversation.targetId)?.draft
    },

    /** 设置草稿 */
    setConversationDraft(
      conversation: { type: number; targetId: number },
      snapshot: NonNullable<Conversation['draft']>
    ): void {
      if (!snapshot.plain.trim() && !snapshot.reply) {
        this.clearConversationDraft(conversation)
        return
      }
      const target = this.getConversation(conversation.type, conversation.targetId)
      if (!target) {
        return
      }
      target.draft = snapshot
      this.scheduleConversationDraftSave(target)
    },

    /** 清除草稿 */
    clearConversationDraft(conversation: { type: number; targetId: number }): void {
      const target = this.getConversation(conversation.type, conversation.targetId)
      if (!target?.draft) {
        return
      }
      target.draft = undefined
      this.scheduleConversationDraftSave(target)
    },

    /** 设置回复草稿 */
    setConversationReplyDraft(
      conversation: { type: number; targetId: number },
      quote: NonNullable<Conversation['draft']>['reply']
    ) {
      if (!quote) {
        return
      }
      const existing = this.getConversationDraft(conversation)
      this.setConversationDraft(conversation, {
        html: existing?.html ?? '',
        plain: existing?.plain ?? '',
        reply: quote
      })
    },

    /** 清除回复草稿 */
    clearConversationReplyDraft(conversation: { type: number; targetId: number }): void {
      const existing = this.getConversationDraft(conversation)
      if (!existing?.reply) {
        return
      }
      this.setConversationDraft(conversation, { ...existing, reply: undefined })
    },

    /** 调度草稿保存 */
    scheduleConversationDraftSave(conversation: Conversation): void {
      pendingDraftConversations.add(conversation)
      saveDraftConversationListDebounced()
    },

    /** 立即保存草稿 */
    flushConversationDraftSave(): void {
      saveDraftConversationListDebounced.flush()
    }
  }
})

export const useConversationStoreWithOut = () => useConversationStore(store)

/** 合并草稿写入 */
const saveDraftConversationListDebounced = debounce(() => {
  const conversations = Array.from(pendingDraftConversations)
  pendingDraftConversations.clear()
  if (conversations.length === 0) {
    return
  }
  void useConversationStoreWithOut()
    .saveConversationRecord(conversations)
    .catch((e) => console.warn('[IM conversationStore] 草稿写入失败', e))
}, PERSIST_DRAFT_DEBOUNCE_MS)

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useConversationStore, import.meta.hot))
}
