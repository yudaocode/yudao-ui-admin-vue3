import { store } from '@/store/index'
import { defineStore } from 'pinia'
import BaseConversation from '../model/BaseConversation'
import BaseMessage from '../model/BaseMessage'
import { ConversationModelType, MessageRole, ContentType, SendStatus, MENU_LIST_ENUM, CONVERSATION_TYPE } from '../types/types'
import SessionApi from '../api/sessionApi'
import MessageApi, { SendMsg } from '../api/messageApi'
import { useUserStore, useUserStoreWithOut } from '@/store/modules/user'
import { formatDate } from '@/utils/formatTime'
import { addConversation, getAllConversations } from '@/store/indexedDB'
import { ChatConversation } from '../model/ChatConversation'
import { generateConversationNo } from './websocketStore'

// TODO @dylan：是不是 chat => im；session => conversation；这样统一一点哈。
interface ChatStoreModel {
  sessionList: Array<ConversationModelType>
  currentSession: ConversationModelType | null
  currentSessionIndex: number
  inputText: string,
  bussinessType: number  // conversation 1, friends 2
}

export const useChatStore = defineStore('chatStore', {
  state: (): ChatStoreModel => ({
    sessionList: [],
    currentSession: null,
    currentSessionIndex: 0,
    inputText: '',
    bussinessType: 1,
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

    setBussinessType(type: number) {
      this.bussinessType = type
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
      } finally {
        this.setInputText('')
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
     * 添加消息到会话
     * @param message
     */
    addMessageToConversation<T extends BaseMessage>(message: T): void {
      
      const converstionNo = generateConversationNo(
        message.senderId,
        message.receiverId,
        message.conversationType
      )

      const conversationIndex = this.sessionList.findIndex(
        (item) => item.conversationNo === converstionNo
      )

      if (conversationIndex < 0) {
        console.log('conversation not exist, create it')
        // Todo 
        return
      }

      const msgConversation = this.sessionList[conversationIndex]
      msgConversation.msgList.push(message)

      // replace the old Conversation
      this.sessionList.splice(conversationIndex, 1, msgConversation)

      // 更新消息到indexeddb
      addConversation(toRaw(msgConversation) as ChatConversation )

      // 更新当前会话 
      if (conversationIndex === this.currentSessionIndex) {
        this.setCurrentConversation()
      }
    },

    /**
     * 根据消息创建会话
     * @param BaseMessage 
     * @param msg 
     */
    createConversation(BaseMessage: msg) {
      
    },

    /**
     * 生成会话No
     * @param id1
     * @param id2 
     * @param conversationType 
     * @returns 
     */
    generateConversationNo(id1: string, id2: string, conversationType: CONVERSATION_TYPE): string {
      const SINGLE_PREFIX = 's_'
      const GROUP_PREFIX = 'g_'
      const [smallId, largeId] = id1 < id2 ? [id1, id2] : [id2, id1];

      if (conversationType === CONVERSATION_TYPE.SINGLE) {
        return SINGLE_PREFIX + smallId + "_" + largeId
      } else if (conversationType === CONVERSATION_TYPE.GROUP) {
        return GROUP_PREFIX + smallId + "_" + largeId
      }

      return ''
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

        const rawCurrentSesstion = toRaw(this.currentSession)
        rawCurrentSesstion.msgList =this.currentSession.msgList.map(item => toRaw(item))
        console.log("raw", rawCurrentSesstion)
        addConversation(rawCurrentSesstion as ChatConversation)
      }
    },

    async getConversationList() {
      try {
        // 从数据库获取数据
        const _conversationList = await getAllConversations()

        if (_conversationList) {
          // 加载到内存
          // TODO:[dylan]处理排序
          this.sessionList = _conversationList
        }
      } catch (error) {
        console.log(error)
      } finally{

        // 本地没有数据的时候才请求接口
        if (this.sessionList.length === 0) {
          this.getSessionFromServer()
        }
      }
    },

    async getSessionFromServer() {
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

        // 同步到数据库
        this.sessionList.forEach((item) => {
          console.log(item)
          addConversation(toRaw(item) as ChatConversation)
        })
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
          receiverId: this.currentSession.targetId,
          userId: this.currentSession.senderId,
          // sendTime: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
          conversationType: this.currentSession.type
        })

        this.currentSession.msgList = res.map((item) => {
          return {
            ...item,
            role: item.senderId === userStore.user.id ? MessageRole.SELF : MessageRole.OTHER,
            nickname: item.senderNickname,
            avatar: item.senderAvatar
          }
        })

        addConversation(toRaw(this.currentSession) as ChatConversation)
      } catch (error) {
        return error
      }
    },


    /**
     * 创建会话
     */
    async createConversation(targetId, type, avatar, nickname) {
      try {
        const param = {
          targetId,
          type
        }
        const res = await SessionApi.createConversation(param)
        if (res) {

          // 切换到聊天模式
          this.bussinessType = MENU_LIST_ENUM.CONVERSATION

          // 插入用户名和昵称
          res.avatar = avatar;
          res.nickname = nickname;
          const localConversation = this.convertCoversationFromServer(res)
          // 存入到数据库
          addConversation(toRaw(localConversation) as ChatConversation)
          // 从数据库同步到内存
          await this.getConversationList()
          // 设置当前的会话
          const addIndex = this.sessionList.findIndex(item => item.conversationNo === localConversation.conversationNo)
          this.setCurrentSessionIndex(addIndex)
          this.setCurrentConversation()

        }

      } catch (error) {
        console.log(error)
      }
    },

    convertCoversationFromServer(item: any) {
      return {
        ...item,
        updateTime: item.updateTime,
        targetId: item.targetId,
        senderId: item.userId,
        conversationNo: item.no,
        unreadMessagesCount: item.unreadMessagesCount,
        description: item.lastMessageDescription,
        avatar: item.avatar,
        name: item.name,
        msgList: []
      }
    }


  }
})

export const useChatStoreWithOut = () => {
  return useChatStore(store)
}
