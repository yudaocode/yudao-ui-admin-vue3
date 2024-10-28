import { store } from '@/store/index'
import { defineStore } from 'pinia'
import BaseConversation from '../model/BaseConversation'
import BaseMessage from '../model/BaseMessage'
import { ConversationModelType, MessageRole, ContentType, SendStatus } from '../types/index.d.ts'
import SessionApi from '../api/sessionApi'
import MessageApi, { SendMsg } from '../api/messageApi'
import { useUserStoreWithOut } from '@/store/modules/user'

// TODO @dylan：是不是 chat => im；session => conversation；这样统一一点哈。
interface ChatStoreModel {
  sessionList: Array<ConversationModelType>
  currentSession: ConversationModelType | null
  currentSessionIndex: number
  inputText: string
}

export const useChatStore = defineStore('chatStore', {
  state: (): ChatStoreModel => ({
    sessionList: [],
    currentSession: null,
    currentSessionIndex: 0,
    inputText: ''
  }),

  getters: {
    getSessionList(state: ChatStoreModel): Array<ConversationModelType> {
      return state.sessionList
    },

    getCurrentSession(state: ChatStoreModel): ConversationModelType | null {
      return state.currentSession
    },

    getCurrentSessionIndex(state: ChatStoreModel): number {
      return state.currentSessionIndex
    }
  },

  actions: {
    addSession(session: BaseConversation) {
      this.sessionList.push(session)
    },

    setCurrentConversation() {
      this.currentSession = this.sessionList[this.currentSessionIndex]
      this.fetchSessionMsg()
    },

    setCurrentSessionIndex(index: number) {
      this.currentSessionIndex = index
    },

    setInputText(content: string) {
      this.inputText = content
    },

    async addMessageToCurrentSession<T extends BaseMessage>(message: T): Promise<void> {
      this.currentSession?.msgList.push(message)

      try {
        const res = await MessageApi.send(message as unknown as SendMsg)
        console.log(res)
        if (res.id) {
          // 更新发送状态
          const updateMsg = {
            ...message,
            id: res.id,
            sendTime: res.sendTime,
            sendStatus: SendStatus.SUCCESS
          }

          this.updateMsgToCurrentSession(updateMsg)
        }
      } catch (error) {
        console.log(error)
        const updateMsg = {
          ...message,
          sendStatus: SendStatus.SUCCESS
        }

        this.updateMsgToCurrentSession(updateMsg)
      }
    },

    addMessageToSesstion<T extends BaseMessage>(message: T): void {
      // get the conversation from list
      const conversationIndex = this.sessionList.findIndex((item) => {
        return item.id === message.conversationId
      })

      const msgConversation = this.sessionList[conversationIndex]

      // add the message
      msgConversation?.msgList.push(message)

      // replace the old Conversation
      this.sessionList.splice(conversationIndex, 1, msgConversation)
    },

    /**
     * 更新消息到当前会话
     * @param updatedMsg
     */
    updateMsgToCurrentSession<T extends BaseMessage>(updatedMsg: T): void {
      if (this.currentSession) {
        this.currentSession.msgList = this.currentSession?.msgList.map((item) => {
          if (item.clientMessageId === updatedMsg.clientMessageId) {
            return updatedMsg
          } else {
            return item
          }
        })
      }
    },

    async getSession() {
      try {
        const res = await SessionApi.getSessionList()
        this.sessionList = res.map((item) => ({
          ...item,
          updateTime: item.lastReadTime,
          name: item.targetId,
          targetId: item.targetId,
          senderId: item.userId,
          conversationNo: item.no,
          unreadMessagesCount: item.unreadMessagesCount,
          description: item.lastMessageDescription,
          msgList: []
        }))
      } catch (error) {
        return error
      }
    },

    async fetchSessionMsg() {
      if (!this.currentSession) {
        return
      }

      const userStore = useUserStoreWithOut()

      try {
        const res = await MessageApi.getSessionMsg({
          conversationNo: this.currentSession.conversationNo
          // sendTime: new Date().toISOString().slice(0, -1)
        })

        this.currentSession.msgList = res.map((item) => {
          return {
            ...item,
            role: item.senderId === userStore.user.id ? MessageRole.SELF : MessageRole.OTHER,
            nickname: item.senderNickname,
            avatar: item.senderAvatar
          }
        })
      } catch (error) {
        return error
      }
    }
  }
})

export const useChatStoreWithOut = () => {
  return useChatStore(store)
}
