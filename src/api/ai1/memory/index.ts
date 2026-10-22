import request from '@/config/axios'

/** AI1 长期记忆信息 */
export interface Memory {
  id: number // 编号
  agentId: number // Agent 编号
  agentName?: string // Agent 名称
  userId: number // 用户编号
  userNickname?: string // 用户昵称
  content: string // 记忆正文，按维度分节的 Markdown
  lastMessageId: number // 已归档的最后消息编号
  createTime: Date // 创建时间
  updateTime: Date // 更新时间
}

// AI1 长期记忆 API
export const MemoryApi = {
  // 查询长期记忆分页
  getMemoryPage: async (params: any) => {
    return await request.get({ url: `/ai1/memory/page`, params })
  },

  // 查询长期记忆详情
  getMemory: async (id: number): Promise<Memory> => {
    return await request.get({ url: `/ai1/memory/get?id=` + id })
  },

  // 修改长期记忆正文
  updateMemory: async (data: Pick<Memory, 'id' | 'content'>) => {
    return await request.put({ url: `/ai1/memory/update`, data })
  },

  // 删除长期记忆，之后会根据历史对话重新生成
  deleteMemory: async (id: number) => {
    return await request.delete({ url: `/ai1/memory/delete?id=` + id })
  },

  // 批量删除长期记忆
  deleteMemoryList: async (ids: number[]) => {
    return await request.delete({ url: `/ai1/memory/delete-list?ids=${ids.join(',')}` })
  }
}
