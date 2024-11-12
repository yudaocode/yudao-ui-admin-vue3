import { defineStore } from 'pinia'
import { ref, onUnmounted } from 'vue'
import { getRefreshToken } from '@/utils/auth'
import { useChatStore } from './chatstore'
import {
  ContentType,
  ImMessageContent,
  ImMessageReceiveResponse,
  WEBSOCKET_MESSAGE_TYPE_ENUM
} from '../types/types'
import TextMessage from '../model/TextMessage'
import { debug } from 'console'
import { useUserStore } from '@/store/modules/user'

interface Message {
  type: string
  data: any
}

enum ImConversationTypeEnum {
  SINGLE = 1,
  GROUP = 2
  // Add other conversation types if needed
}

export function generateConversationNo(
  fromUserId: number,
  receiverId: number,
  conversationType: number
): string | null {
  if (conversationType === ImConversationTypeEnum.SINGLE) {
    return `s_${fromUserId}_${receiverId}`
  } else if (conversationType === ImConversationTypeEnum.GROUP) {
    return `g_${receiverId}`
  }
  return null
}

export const useWebSocketStore = defineStore('webSocket', () => {
  const socket = ref<WebSocket | null>(null)
  const messages = ref<Message[]>([])
  const isConnected = ref(false)
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null

  // 初始化 WebSocket 连接
  function connect() {
    const refreshToken = getRefreshToken()

    // 设置 WebSocket URL
    if (refreshToken) {
      console.log('refreshToken null')
    }

    const url = `ws://localhost:48080/infra/ws?token=${refreshToken}`
    socket.value = new WebSocket(url)

    socket.value.onopen = () => {
      isConnected.value = true
      console.log('WebSocket connected')
      startHeartbeat()
    }

    // {"type":"im-message-receive",
    //  "content":
    //  "{\
    //     "id\":239,\
    //    "conversationType\":1,\
    //    "senderId\":144,\
    //    "senderNickname\":\"dylan\",\
    //    "senderAvatar\":\"http://192.168.0.208:48083/admin-api/infra/file/4/get/c34f9521ce6a2e21148f16b73ab652e578b5bb572dbc259a5043f754c19c8a3f.png\",\
    //    "receiverId\":1,\
    //    "contentType\":101,\
    //    "content\":\"111\",\
    //    "sendTime\":1731139168438,\
    //    "sequence\":2}"
    //   }
    socket.value.onmessage = (event) => {

      if (event.data === 'pong') {
        return 
      }
            
      try {
        const websoketMessage = JSON.parse(event.data) as ImMessageReceiveResponse
        if (websoketMessage.type === WEBSOCKET_MESSAGE_TYPE_ENUM.IM_MESSAGE_RECEIVE.toString()) {
          const socketChatMessage = JSON.parse(websoketMessage.content) as ImMessageContent
          
          // 暂不处理自己发送的消息
          if (socketChatMessage.senderId === useUserStore().user.id) {
            return
          }

          if (socketChatMessage.contentType === ContentType.TEXT) {
            const chatStore = useChatStore()
            const localTextMessage = TextMessage.fromWebsocket(socketChatMessage)
            chatStore.addMessageToConversation(localTextMessage)
          } else if (socketChatMessage.contentType === ContentType.IMAGE) {

          } else if (socketChatMessage.contentType === ContentType.AUDIO) {

          }

        } else {
          // TODO:[dylan]
        }

        console.log('Received message:', websoketMessage)

      } catch (error) {
        console.info(error)
      }

      // messages.value.push(message)

    }

    socket.value.onclose = () => {
      isConnected.value = false
      console.log('WebSocket disconnected')
      reconnect()
    }

    socket.value.onerror = (error) => {
      console.error('WebSocket error:', error)
      isConnected.value = false
      reconnect()
    }
  }

  // 发送消息
  function sendMessage(message: Message) {
    if (socket.value && isConnected.value) {
      socket.value.send(JSON.stringify(message))
    }
  }

  /**
   * 发送心跳消息
   */
  function sendHeartBeat() {
    if (socket.value && isConnected.value) {
      socket.value.send('ping')
    }
  }

  // 断开 WebSocket 连接
  function disconnect() {
    if (socket.value) {
      socket.value.close()
      socket.value = null
    }
    stopHeartbeat()
    clearTimeout(reconnectTimer!)
  }

  // 自动重连逻辑
  function reconnect() {
    stopHeartbeat()
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(() => {
      console.log('Reconnecting WebSocket...')
      connect()
    }, 3000) // 3秒后重连
  }

  // 启动心跳
  function startHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    heartbeatTimer = setInterval(() => {
      if (socket.value && isConnected.value) {
        sendHeartBeat()
        console.log('Heartbeat sent')
      }
    }, 5000) // 每5秒发送一次心跳
  }

  // 停止心跳
  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  // 自动断开连接，清理资源
  onUnmounted(() => {
    disconnect()
  })

  return {
    connect,
    disconnect,
    sendMessage,
    messages,
    isConnected,
    generateConversationNo
  }
})
