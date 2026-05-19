import { defineStore, acceptHMRUpdate } from 'pinia'
import { store } from '@/store'
import { getEnabledChannelList, type ImManagerChannelVO } from '@/api/im/manager/channel'
import { useConversationStore } from './conversationStore'
import { ImConversationType } from '../../utils/constants'
import { getCurrentUserId, imStorage, setQuietly, StorageKeys } from '../../utils/storage'

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

    /** 从 IDB 恢复频道列表；命中返回 true 让首屏立刻有真实名 / 头像 */
    async loadChannels(): Promise<boolean> {
      const userId = getCurrentUserId()
      if (!userId) {
        return false
      }
      try {
        const cached = await imStorage.getItem<ImManagerChannelVO[]>(StorageKeys.channels(userId))
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

    /** 整桶持久化频道列表（量级小，不维护增量） */
    saveChannels(): void {
      const userId = getCurrentUserId()
      if (!userId) {
        return
      }
      setQuietly(StorageKeys.channels(userId), this.channels, '[IM channelStore] 本地频道缓存写入失败')
    },

    // ==================== 远端拉取 ====================

    /** 拉取启用的频道精简列表；成功后回填会话列表已有的频道 name / avatar，覆盖 IDB 旧占位 */
    async fetchChannels(force = false) {
      if (this.loaded && !force) {
        return
      }
      try {
        this.channels = (await getEnabledChannelList()) || []
        this.loaded = true
        this.syncConversationMetadata()
        this.saveChannels()
      } catch (e) {
        console.warn('[IM channelStore] fetchChannels 失败', e)
      }
    },

    /** 用最新的频道信息覆盖已有 CHANNEL 会话的 name / avatar；conversationStore 持久化的旧占位被刷掉 */
    syncConversationMetadata() {
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
        if (channel.name) {
          conversation.name = channel.name
        }
        if (channel.avatar) {
          conversation.avatar = channel.avatar
        }
      })
    }
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useChannelStore, import.meta.hot))
}

export const useImChannelStore = () => useChannelStore(store)
