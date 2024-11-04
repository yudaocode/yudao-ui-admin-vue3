import { store } from '@/store'
import { defineStore } from 'pinia'
import { KeFuConversationApi, KeFuConversationRespVO } from '@/api/mall/promotion/kefu/conversation'
import { KeFuMessageRespVO } from '@/api/mall/promotion/kefu/message'

// TODO puhui999: 待优化完善
interface MallKefuInfoVO {
  conversationList: KeFuConversationRespVO[] // 会话列表
  conversationMessageList: Map<number, KeFuMessageRespVO[]> // 会话消息
}

export const useMallKefuStore = defineStore('mall-kefu', {
  state: (): MallKefuInfoVO => ({
    conversationList: [],
    conversationMessageList: new Map<number, KeFuMessageRespVO[]>() // key 会话，value 会话消息列表
  }),
  getters: {
    getConversationList(): KeFuConversationRespVO[] {
      return this.conversationList
    },
    getConversationMessageList(): Map<number, KeFuMessageRespVO[]> {
      return this.conversationMessageList
    }
  },
  actions: {
    async setConversationList() {
      const list = await KeFuConversationApi.getConversationList()
      list.sort((a: KeFuConversationRespVO, _) => (a.adminPinned ? -1 : 1))
      this.conversationList = list
    }
    // async setConversationMessageList(conversationId: number) {}
  }
})

export const useUserStoreWithOut = () => {
  return useMallKefuStore(store)
}
