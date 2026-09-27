import request from '@/config/axios'

// AI 预算使用情况 VO
export interface BudgetUsageVO {
  userId: number
  periodStartTime: Date
  currency: string
  usedAmount: number
  usedAmountYuan: number
  budgetAmount: number
  budgetAmountYuan: number
  remainAmount: number
  remainAmountYuan: number
  usagePercent: number
}

// AI 预算使用情况 API
export const BudgetUsageApi = {
  // 查询当前周期预算使用情况
  getBudgetUsage: async (userId: number) => {
    return await request.get({ url: `/ai/budget-usage/get?userId=` + userId })
  }
}
