import request from '@/config/axios'

// AI 预算配置 VO
export interface BudgetConfigVO {
  id: number
  userId: number
  periodType: string
  currency: string
  budgetAmount: number
  budgetAmountYuan: number
  alertThresholds: string
  status: number
  createTime: Date
}

// AI 预算配置 API
export const BudgetConfigApi = {
  // 查询分页
  getBudgetConfigPage: async (params: any) => {
    return await request.get({ url: `/ai/budget-config/page`, params })
  },

  // 查询详情
  getBudgetConfig: async (id: number) => {
    return await request.get({ url: `/ai/budget-config/get?id=` + id })
  },

  // 新增
  createBudgetConfig: async (data: BudgetConfigVO) => {
    return await request.post({ url: `/ai/budget-config/create`, data })
  },

  // 修改
  updateBudgetConfig: async (data: BudgetConfigVO) => {
    return await request.put({ url: `/ai/budget-config/update`, data })
  },

  // 删除
  deleteBudgetConfig: async (id: number) => {
    return await request.delete({ url: `/ai/budget-config/delete?id=` + id })
  }
}
