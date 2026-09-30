import request from '@/config/axios'

/** AI1 Agent 信息 */
export interface Agent {
  id?: number // 编号
  name: string // 名称
  introduction?: string // 介绍
  providerId: number // 模型供应商编号
  providerName?: string // 模型供应商名称
  modelId: number // 对话模型编号
  modelName?: string // 对话模型名称
  systemPrompt?: string // 系统指令
  knowledgeBaseIds?: number[] // 知识库编号集合
  mcpIds?: number[] // MCP 编号集合
  skillIds?: number[] // SKILL 编号集合
  status?: number // 状态
  createTime?: Date // 创建时间
  updateTime?: Date // 更新时间
}

// AI1 Agent API
export const AgentApi = {
  // 查询 Agent 分页
  getAgentPage: async (params: any) => {
    return await request.get({ url: `/ai1/agent/page`, params })
  },

  // 查询 Agent 详情
  getAgent: async (id: number) => {
    return await request.get({ url: `/ai1/agent/get?id=` + id })
  },

  // 查询 Agent 精简列表
  getAgentSimpleList: async (): Promise<Agent[]> => {
    return await request.get({ url: `/ai1/agent/simple-list` })
  },

  // 新增 Agent
  createAgent: async (data: Agent) => {
    return await request.post({ url: `/ai1/agent/create`, data })
  },

  // 修改 Agent
  updateAgent: async (data: Agent) => {
    return await request.put({ url: `/ai1/agent/update`, data })
  },

  // 删除 Agent
  deleteAgent: async (id: number) => {
    return await request.delete({ url: `/ai1/agent/delete?id=` + id })
  },

  // 批量删除 Agent
  deleteAgentList: async (ids: number[]) => {
    return await request.delete({ url: `/ai1/agent/delete-list?ids=${ids.join(',')}` })
  },

  // 修改 Agent 状态
  updateAgentStatus: async (id: number, status: number) => {
    return await request.put({ url: `/ai1/agent/update-status`, data: { id, status } })
  }
}
