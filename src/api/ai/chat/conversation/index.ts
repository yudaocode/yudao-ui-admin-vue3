import request from '@/config/axios'

// 聊天VO
export interface ChatConversationVO {
  id: string // 会话编号
  userId: string // 用户编号
  title: string // 会话标题
  pinned: string // 是否置顶
  roleId: string // 角色编号
  model: number // 模型标志
  modelId: number // 模型编号
  temperature: string // 温度参数
  maxTokens: string // 单条回复的最大 Token 数量
  maxContexts: string // 上下文的最大 Message 数量
}

export interface ChatConversationUpdateVO {
  id: string // 会话编号
  title: string // 会话标题
  pinned: string // 是否置顶
  modelId: number // 模型编号
  temperature: string // 温度参数
  maxTokens: string // 单条回复的最大 Token 数量
  maxContexts: string // 上下文的最大 Message 数量
}

// AI chat 聊天
export const ChatConversationApi = {
  // 获取 Conversation
  get: async (id: number) => {
    return await request.get({ url: `/ai/chat/conversation/get?id=${id}`})
  },
  // 更新 Conversation
  update: async (data: ChatConversationUpdateVO) => {
    return await request.put({ url: `/ai/chat/conversation/update`, data})
  },
}
