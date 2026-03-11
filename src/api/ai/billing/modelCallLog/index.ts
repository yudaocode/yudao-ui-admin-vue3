import request from '@/config/axios'

// AI 模型调用日志 VO
export interface ModelCallLogVO {
  id: number
  userId: number
  platform: string
  modelId: number
  model: string
  bizType: string
  bizId: number
  conversationId: number
  requestTime: Date
  responseTime: Date
  durationMs: number
  status: string
  errorMessage: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cachedTokens: number
  reasoningTokens: number
  tokenSource: string
  currency: string
  priceInPer1m: number
  priceOutPer1m: number
  costAmount: number
  blocked: boolean
  createTime: Date
}

// AI 调用日志统计 VO
export interface ModelCallLogStatVO {
  totalCount: number
  successCount: number
  failCount: number
  totalPromptTokens: number
  totalCompletionTokens: number
  totalTokens: number
  totalCostAmount: number
  totalCostAmountYuan: number
  avgDurationMs: number
}

// AI 模型调用日志 API
export const ModelCallLogApi = {
  // 查询分页
  getModelCallLogPage: async (params: any) => {
    return await request.get({ url: `/ai/model-call-log/page`, params })
  },

  // 查询统计
  getModelCallLogStat: async (params: any) => {
    return await request.get({ url: `/ai/model-call-log/stat`, params })
  },

  // 导出
  exportModelCallLog: async (params: any) => {
    return await request.download({ url: `/ai/model-call-log/export-excel`, params })
  }
}
