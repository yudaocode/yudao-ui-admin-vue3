import { defineStore, acceptHMRUpdate } from 'pinia'
import { store } from '@/store'
import { getSimpleChannelList, type ImManagerChannelVO } from '@/api/im/manager/channel'
import { useConversationStore } from './conversationStore'
import { ImConversationType } from '../../utils/constants'
import { getDb } from '../../utils/db'
import type { ChannelDO } from '../types'

/**
 * IM 频道 Store
 *
 * 负责：缓存当前用户能看到的频道精简列表（含 id / code / name / avatar），
 * 供会话列表 / 卡片渲染时反查频道名称 + 头像，避免显示「频道 1」这种占位
 */
export const useChannelStore = defineStore('imChannelStore', {
  state: () => ({
    channels: [] as ImManagerChannelVO[],
    loaded: false
  }),

  getters: {
    getChannel(state): (id: number) => ImManagerChannelVO | undefined {
      return (id: number) => state.channels.find((c) => c.id === id)
    }
  },

  actions: {
    // ==================== 本地缓存 ====================

    /** 从 IndexedDB 恢复频道列表 */
    async loadChannelList(): Promise<boolean> {
      try {
        const cached = await getDb().getAll<ChannelDO>('channels')
        if (!cached || cached.length === 0) {
          return false
        }
        this.channels = cached
        return true
      } catch (e) {
        console.warn('[IM channelStore] 本地频道缓存读取失败', e)
        return false
      }
    },

    /** 保存频道列表 */
    saveChannelList(): void {
      void getDb()
        .transaction(['channels'], 'readwrite', async (tx) => {
          const db = getDb()
          await db.clearStore('channels', tx)
          for (const channel of this.channels) {
            await db.put('channels', channel, tx)
          }
        })
        .catch((e) => console.warn('[IM channelStore] 本地频道缓存写入失败', e))
    },

    // ==================== 远端拉取 ====================

    /** 拉取启用的频道精简列表；成功后回填会话列表已有的频道 name / avatar，覆盖 IDB 旧占位 */
    async fetchChannelList(force = false) {
      if (this.loaded && !force) {
        return
      }
      try {
        this.channels = (await getSimpleChannelList()) || []
        this.loaded = true
        this.syncChannelConversationMetadata()
        this.saveChannelList()
      } catch (e) {
        console.warn('[IM channelStore] fetchChannelList 失败', e)
      }
    },

    /** 用最新的频道信息覆盖已有 CHANNEL 会话的 name / avatar */
    syncChannelConversationMetadata() {
      const conversationStore = useConversationStore()
      const indexed = new Map(this.channels.map((c) => [c.id, c]))
      conversationStore.conversations.forEach((conversation) => {
        if (conversation.type !== ImConversationType.CHANNEL) {
          return
        }
        const channel = indexed.get(conversation.targetId)
        if (!channel) {
          return
        }
        conversationStore.updateConversation(ImConversationType.CHANNEL, conversation.targetId, {
          name: channel.name,
          avatar: channel.avatar
        })
      })
    },

    /** 清空频道内存 */
    clear() {
      this.channels = []
      this.loaded = false
    }
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useChannelStore, import.meta.hot))
}

export const useChannelStoreWithOut = () => useChannelStore(store)
