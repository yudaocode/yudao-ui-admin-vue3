import request from '@/config/axios'

// 聊天VO
export interface ChatMessageVO {
  id: number // 编号
  conversationId: string // 会话编号
  type: string // 消息类型
  userId: string // 用户编号
  roleId: string // 角色编号
  model: number // 模型标志
  modelId: number // 模型编号
  content: number // 聊天内容
  tokens: number // 消耗 Token 数量
  createTime: Date // 创建时间
}

export interface ChatMessageSendVO {
  conversationId: string // 会话编号
  content: number // 聊天内容
}

// AI chat 聊天
export const ChatMessageApi = {

  // 消息列表
  messageList: async (conversationId: string) => {
    return await request.get({ url: `/ai/chat/message/list-by-conversation-id?conversationId=${conversationId}`})
  },

  // 发送 send 消息
  send: async (data: ChatMessageSendVO) => {
    return await request.post({ url: `/ai/chat/message/send`, data })
  },


  // 发送 send 消息
  delete: async (id: string) => {
    return await request.delete({ url: `/ai/chat/message/delete?id=${id}` })
  },

}
