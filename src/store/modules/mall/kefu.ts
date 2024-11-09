import { store } from '@/store'
import { defineStore } from 'pinia'
import { KeFuConversationApi, KeFuConversationRespVO } from '@/api/mall/promotion/kefu/conversation'
import { KeFuMessageRespVO } from '@/api/mall/promotion/kefu/message'
import { isEmpty } from '@/utils/is'

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
    getConversationMessageList(): (conversationId: number) => KeFuMessageRespVO[] | undefined {
      return (conversationId: number) => this.conversationMessageList.get(conversationId)
    }
  },
  actions: {
    //======================= 会话消息相关 =======================
    /** 缓存历史消息 */
    saveMessageList(conversationId: number, messageList: KeFuMessageRespVO[]) {
      this.conversationMessageList.set(conversationId, messageList)
    },
    //======================= 会话相关 =======================
    /** 加载会话缓存列表 */
    async setConversationList() {
      this.conversationList = await KeFuConversationApi.getConversationList()
      this.conversationSort()
    },
    /** 更新会话缓存已读 */
    async updateConversationStatus(conversationId: number) {
      if (isEmpty(this.conversationList)) {
        return
      }
      const conversation = this.conversationList.find((item) => item.id === conversationId)
      conversation && (conversation.adminUnreadMessageCount = 0)
    },
    /** 更新会话缓存 */
    async updateConversation(conversationId: number) {
      if (isEmpty(this.conversationList)) {
        return
      }

      const conversation = await KeFuConversationApi.getConversation(conversationId)
      this.deleteConversation(conversationId)
      conversation && this.conversationList.push(conversation)
      this.conversationSort()
    },
    /** 删除会话缓存 */
    deleteConversation(conversationId: number) {
      const index = this.conversationList.findIndex((item) => item.id === conversationId)
      // 存在则删除
      if (index > -1) {
        this.conversationList.splice(index, 1)
      }
    },
    conversationSort() {
      this.conversationList.sort((obj1, obj2) => {
        // 如果 obj1.adminPinned 为 true，obj2.adminPinned 为 false，obj1 应该排在前面
        if (obj1.adminPinned && !obj2.adminPinned) return -1
        // 如果 obj1.adminPinned 为 false，obj2.adminPinned 为 true，obj2 应该排在前面
        if (!obj1.adminPinned && obj2.adminPinned) return 1

        // 如果 obj1.adminPinned 和 obj2.adminPinned 都为 true，比较 adminUnreadMessageCount 的值
        if (obj1.adminPinned && obj2.adminPinned) {
          return obj1.adminUnreadMessageCount - obj2.adminUnreadMessageCount
        }

        // 如果 obj1.adminPinned 和 obj2.adminPinned 都为 false，比较 adminUnreadMessageCount 的值
        if (!obj1.adminPinned && !obj2.adminPinned) {
          return obj1.adminUnreadMessageCount - obj2.adminUnreadMessageCount
        }

        // 如果 obj1.adminPinned 为 true，obj2.adminPinned 为 true，且 b 都大于 0，比较 adminUnreadMessageCount 的值
        if (
          obj1.adminPinned &&
          obj2.adminPinned &&
          obj1.adminUnreadMessageCount > 0 &&
          obj2.adminUnreadMessageCount > 0
        ) {
          return obj1.adminUnreadMessageCount - obj2.adminUnreadMessageCount
        }

        // 如果 obj1.adminPinned 为 false，obj2.adminPinned 为 false，且 b 都大于 0，比较 adminUnreadMessageCount 的值
        if (
          !obj1.adminPinned &&
          !obj2.adminPinned &&
          obj1.adminUnreadMessageCount > 0 &&
          obj2.adminUnreadMessageCount > 0
        ) {
          return obj1.adminUnreadMessageCount - obj2.adminUnreadMessageCount
        }

        return 0
      })
    }
  }
})

export const useMallKefuStoreWithOut = () => {
  return useMallKefuStore(store)
}
