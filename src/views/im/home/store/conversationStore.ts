import { acceptHMRUpdate, defineStore } from 'pinia'
import { debounce } from 'lodash-es'
import { store } from '@/store'

import { CONVERSATION_RECENT_FORWARD_MAX } from '../../utils/config'
import { ImConversationType } from '../../utils/constants'
import { getClientConversationId, getDb, StorageKeys, type DbTransaction } from '../../utils/db'
import { getCurrentUserId } from '@/utils/auth'
import { useMessageStore } from './messageStore'
import type { Conversation, ConversationDO } from '../types'

const PERSIST_DRAFT_DEBOUNCE_MS = 500
const pendingDraftConversations = new Set<Conversation>()

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

export const useConversationStore = defineStore('imConversationStore', {
  state: () => ({
    conversations: [] as Conversation[], // 全量会话列表（私聊 + 群聊 + 频道）
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
        )
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
      const [conversations, recent] = await Promise.all([
        db.getAll<ConversationDO>('conversations'),
        db.getSetting<string[]>(StorageKeys.settings.recentForwardConversationKeys)
      ])
      this.conversations = conversations.map(fromConversationDO)
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
      this.activeConversation = null
      this.recentForwardConversationKeys = []
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
      // 1. 清理会话级未读状态
      conversation.unreadCount = 0
      conversation.atMe = false
      conversation.atAll = false
      // 2. 懒加载消息并保存会话摘要
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
    markConversationRead(type: number, targetId: number) {
      const conversation = this.getConversation(type, targetId)
      if (!conversation) {
        return
      }
      if (conversation.unreadCount === 0 && !conversation.atMe && !conversation.atAll) {
        return
      }
      conversation.unreadCount = 0
      conversation.atMe = false
      conversation.atAll = false
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
    getConversationDraft(conversation: { type: number; targetId: number }): Conversation['draft'] | undefined {
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
