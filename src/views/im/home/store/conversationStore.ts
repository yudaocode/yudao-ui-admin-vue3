import { acceptHMRUpdate, defineStore } from 'pinia'
import { store } from '@/store'

import { CONVERSATION_RECENT_FORWARD_MAX } from '../../utils/config'
import { ImConversationType } from '../../utils/constants'
import { getClientConversationId, getDb, type DbTx } from '../../utils/db'
import { getCurrentUserId } from '../../utils/storage'
import { useDraftStore } from './draftStore'
import { useMessageStore } from './messageStore'
import type { Conversation, ConversationDO } from '../types'

/** 会话转 IndexedDB 记录 */
function toConversationDO(conversation: Conversation): ConversationDO {
  return {
    ...conversation,
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
    getSortedConversations(state): Conversation[] {
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
    getTotalUnread(state): number {
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
    // TODO @AI：方法里的代码段注释，写一下。
    async loadConversations() {
      const userId = getCurrentUserId()
      if (!userId) {
        this.clear()
        return
      }
      const previousActiveKey = this.activeConversation
        ? getClientConversationId(this.activeConversation.type, this.activeConversation.targetId)
        : null
      this.clear()
      const db = getDb()
      const [conversations, recent] = await Promise.all([
        db.getAll<ConversationDO>('conversations'),
        db.getSetting<string[]>('recentForwardConversationKeys')
      ])
      this.conversations = conversations.map(fromConversationDO)
      if (Array.isArray(recent)) {
        this.recentForwardConversationKeys = recent.slice(0, CONVERSATION_RECENT_FORWARD_MAX)
      }
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
      this.conversations = []
      this.activeConversation = null
      this.recentForwardConversationKeys = []
    },

    /** 执行会话持久化 */
    // TODO @AI：想了下，DbTx 改成 DbTransaction 吧，变量可以叫 tx；
    // TODO @AI：方法里的代码段注释，写一下。
    async persistConversations(
      target?: Conversation | Conversation[] | null,
      tx?: DbTx
    ): Promise<void> {
      const db = getDb()
      const conversations = (
        Array.isArray(target) ? target : target ? [target] : this.conversations
      ).map(toConversationDO)
      if (tx) {
        for (const conversation of conversations) {
          await db.put('conversations', conversation, tx)
        }
        return
      }
      await db.transaction(['conversations'], 'readwrite', async (innerTx) => {
        for (const conversation of conversations) {
          await db.put('conversations', conversation, innerTx)
        }
      })
    },

    /** 持久化会话 */
    saveConversations(target?: Conversation | Conversation[] | null, tx?: DbTx): void {
      if (this.loading && !tx) {
        return
      }
      void this.persistConversations(target, tx).catch((e) =>
        console.warn('[IM conversationStore] 会话写入失败', e)
      )
    },

    /** 确保会话存在 */
    // TODO @AI：方法里的代码段注释，写一下。
    ensureConversation(info: {
      type: number
      targetId: number
      name: string
      avatar: string
      silent?: boolean
    }): Conversation {
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
        conversation.deleted = false
        conversation.name = info.name || conversation.name
        conversation.avatar = info.avatar || conversation.avatar
        if (info.silent !== undefined) {
          conversation.silent = info.silent
        }
      } else {
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
    // TODO @AI：方法里的代码段注释，写一下。
    openConversation(
      targetId: number,
      type: number,
      name: string,
      avatar: string,
      options?: { silent?: boolean }
    ): Conversation {
      const conversation = this.ensureConversation({
        type,
        targetId,
        name,
        avatar,
        silent: options?.silent
      })
      this.setActiveConversation(conversation)
      this.saveConversations(conversation)
      return conversation
    },

    /** 设置当前会话 */
    // TODO @AI：方法里的代码段注释，写一下。
    setActiveConversation(conversation: Conversation | null) {
      this.activeConversation = conversation
      if (!conversation) {
        return
      }
      conversation.unreadCount = 0
      conversation.atMe = false
      conversation.atAll = false
      void useMessageStore().ensureLoaded(conversation)
      this.saveConversations(conversation)
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
    setTop(type: number, targetId: number, top: boolean) {
      const conversation = this.getConversation(type, targetId)
      if (!conversation) {
        return
      }
      conversation.top = top
      this.saveConversations(conversation)
    },

    /** 设置免打扰 */
    setSilent(type: number, targetId: number, silent: boolean) {
      const conversation = this.getConversation(type, targetId)
      if (!conversation) {
        return
      }
      conversation.silent = silent
      // TODO @AI：saveConversations 拆成 saveConversationList、saveConversation 两个方法；
      this.saveConversations(conversation)
    },

    /** 删除会话 */
    // TODO @AI：方法里的代码段注释，写一下。
    removeConversation(type: number, targetId: number) {
      const conversation = this.getConversation(type, targetId)
      if (!conversation) {
        return
      }
      if (this.activeConversation === conversation) {
        this.activeConversation = null
      }
      conversation.deleted = true
      useMessageStore().deleteConversationMessages(type, targetId)
      useDraftStore().clearDraft({ type, targetId })
      this.saveConversations(conversation)
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
    markConversationAsRead(type: number, targetId: number) {
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
      this.saveConversations(conversation)
    },

    // TODO @AI：把最近转发 ==== 拆分下？？？

    /** 推送最近转发会话 */
    pushRecentForwardConversationKeys(keys: string[]) {
      if (!keys || keys.length === 0) {
        return
      }
      const merged = [...keys, ...this.recentForwardConversationKeys]
      this.recentForwardConversationKeys = Array.from(new Set(merged)).slice(
        0,
        CONVERSATION_RECENT_FORWARD_MAX
      )
      this.persistRecentForwardConversationKeys()
    },

    /** 移除最近转发会话 */
    removeRecentForwardConversationKey(key: string) {
      const index = this.recentForwardConversationKeys.indexOf(key)
      if (index < 0) {
        return
      }
      this.recentForwardConversationKeys.splice(index, 1)
      this.persistRecentForwardConversationKeys()
    },

    /** 持久化最近转发会话 */
    persistRecentForwardConversationKeys() {
      void getDb()
        .setSetting(
          'recentForwardConversationKeys',
          this.recentForwardConversationKeys.slice(0, CONVERSATION_RECENT_FORWARD_MAX)
        )
        .catch((e) => console.warn('[IM conversationStore] 最近转发列表写入失败', e))
    },

    /** 重排会话 */
    sortConversations() {
      this.conversations.sort((a, b) => (b.lastSendTime || 0) - (a.lastSendTime || 0))
      this.saveConversations(this.conversations)
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
        this.saveConversations(conversation)
      }
    }
  }
})

export const useConversationStoreWithOut = () => useConversationStore(store)

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useConversationStore, import.meta.hot))
}
