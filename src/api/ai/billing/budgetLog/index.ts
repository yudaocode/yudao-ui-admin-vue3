import request from '@/config/axios'

// AI 预算事件日志 VO
export interface BudgetLogVO {
  id: number
  userId: number
  eventType: string
  periodStartTime: Date
  currency: string
  budgetAmount: number
  usedAmount: number
  deltaAmount: number
  requestBizType: string
  requestBizId: number
  message: string
  createTime: Date
}

// AI 预算事件日志 API
export const BudgetLogApi = {
  // 查询分页
  getBudgetLogPage: async (params: any) => {
    return await request.get({ url: `/ai/budget-log/page`, params })
  }
}
