import request from '@/config/axios'

/** AI1 首页总量统计 */
export interface HomeSummary {
  agentCount: number // Agent 数量
  skillCount: number // SKILL 数量
  mcpCount: number // MCP 数量
  modelCount: number // 模型数量
}

/** AI1 首页按日消息统计 */
export interface HomeMessageSummaryByDate {
  date: string // 日期，格式 yyyy-MM-dd
  count: number // 当日消息数量
}

/** AI1 首页按 Agent 消息统计 */
export interface HomeMessageSummaryByAgent {
  agentId: number // Agent 编号
  agentName?: string // Agent 名称，Agent 已删除时为空
  count: number // 消息数量
}

// AI1 首页 API
export const HomeApi = {
  // 查询总量统计
  getSummary: async (): Promise<HomeSummary> => {
    return await request.get({ url: `/ai1/home/summary` })
  },

  // 查询近 days 天的按日消息统计
  getMessageSummaryByDate: async (days: number): Promise<HomeMessageSummaryByDate[]> => {
    return await request.get({ url: `/ai1/home/message-summary-by-date`, params: { days } })
  },

  // 查询近 days 天的按 Agent 消息统计
  getMessageSummaryByAgent: async (days: number): Promise<HomeMessageSummaryByAgent[]> => {
    return await request.get({ url: `/ai1/home/message-summary-by-agent`, params: { days } })
  }
}
