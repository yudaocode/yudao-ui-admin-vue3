import request from '@/config/axios'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { getAccessToken } from '@/utils/auth'
import { config } from '@/config/axios/config'

// 聊天VO
export interface ChatMessageVO {
  id: number // 编号
  conversationId: number // 对话编号
  type: string // 消息类型
  userId: string // 用户编号
  roleId: string // 角色编号
  model: number // 模型标志
  modelId: number // 模型编号
  content: string // 聊天内容
  tokens: number // 消耗 Token 数量
  createTime: Date // 创建时间
  roleAvatar: string // 角色头像
  userAvatar: string // 创建时间
}

// AI chat 聊天
export const ChatMessageApi = {
  // 消息列表
  getChatMessageListByConversationId: async (conversationId: number | null) => {
    return await request.get({
      url: `/ai/chat/message/list-by-conversation-id?conversationId=${conversationId}`
    })
  },

  // 发送 Stream 消息
  // 为什么不用 axios 呢？因为它不支持 SSE 调用
  sendChatMessageStream: async (
    conversationId: number,
    content: string,
    ctrl,
    enableContext: boolean,
    onMessage,
    onError,
    onClose
  ) => {
    const token = getAccessToken()
    return fetchEventSource(`${config.base_url}/ai/chat/message/send-stream`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      openWhenHidden: true,
      body: JSON.stringify({
        conversationId,
        content,
        useContext: enableContext
      }),
      onmessage: onMessage,
      onerror: onError,
      onclose: onClose,
      signal: ctrl.signal
    })
  },

  // 删除消息
  deleteChatMessage: async (id: string) => {
    return await request.delete({ url: `/ai/chat/message/delete?id=${id}` })
  },

  // 删除指定对话的消息
  deleteByConversationId: async (conversationId: number) => {
    return await request.delete({
      url: `/ai/chat/message/delete-by-conversation-id?conversationId=${conversationId}`
    })
  },

  // 获得消息分页
  getChatMessagePage: async (params: any) => {
    return await request.get({ url: '/ai/chat/message/page', params })
  },

  // 管理员删除消息
  deleteChatMessageByAdmin: async (id: number) => {
    return await request.delete({ url: `/ai/chat/message/delete-by-admin?id=${id}` })
  }
}
