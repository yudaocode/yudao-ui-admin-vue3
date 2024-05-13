import request from '@/config/axios'

// AI 聊天模型 VO
export interface ChatModelVO {
  id: number // 编号
  keyId: number // API 秘钥编号
  name: string // 模型名字
  model: string // 模型标识
  platform: string // 模型平台
  sort: number // 排序
  status: number // 状态
  temperature: number // 温度参数
  maxTokens: number // 单条回复的最大 Token 数量
  maxContexts: number // 上下文的最大 Message 数量
}

// AI 聊天模型 API
export const ChatModelApi = {
  // 查询聊天模型分页
  getChatModelPage: async (params: any) => {
    return await request.get({ url: `/ai/chat-model/page`, params })
  },

  // 获得聊天模型列表
  getChatModelSimpleList: async (status?: number) => {
    return await request.get({
      url: `/ai/chat-model/simple-list`,
      params: {
        status
      }
    })
  },

  // 查询聊天模型详情
  getChatModel: async (id: number) => {
    return await request.get({ url: `/ai/chat-model/get?id=` + id })
  },

  // 新增聊天模型
  createChatModel: async (data: ChatModelVO) => {
    return await request.post({ url: `/ai/chat-model/create`, data })
  },

  // 修改聊天模型
  updateChatModel: async (data: ChatModelVO) => {
    return await request.put({ url: `/ai/chat-model/update`, data })
  },

  // 删除聊天模型
  deleteChatModel: async (id: number) => {
    return await request.delete({ url: `/ai/chat-model/delete?id=` + id })
  }
}
