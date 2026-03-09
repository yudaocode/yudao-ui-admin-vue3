import request from '@/config/axios'

export interface StockTakingPlanVO {
  id?: number
  code?: string
  name?: string
  type?: number
  startTime?: string
  endTime?: string
  blindFlag?: boolean
  frozenFlag?: boolean
  status?: number
  remark?: string
  createTime?: string
}

export const StockTakingPlanApi = {
  updateStockTakingPlanStatus: async (id: number, status: number) => {
    return await request.put({ url: '/mes/wm/stocktaking-plan/update-status?id=' + id + '&status=' + status })
  },

  getStockTakingPlanPage: async (params: any) => {
    return await request.get({ url: '/mes/wm/stocktaking-plan/page', params })
  },

  getStockTakingPlan: async (id: number) => {
    return await request.get({ url: '/mes/wm/stocktaking-plan/get?id=' + id })
  },

  getEnabledConfirmedStockTakingPlanSimpleList: async () => {
    return await request.get({ url: '/mes/wm/stocktaking-plan/simple-list' })
  },

  createStockTakingPlan: async (data: StockTakingPlanVO) => {
    return await request.post({ url: '/mes/wm/stocktaking-plan/create', data })
  },

  updateStockTakingPlan: async (data: StockTakingPlanVO) => {
    return await request.put({ url: '/mes/wm/stocktaking-plan/update', data })
  },

  deleteStockTakingPlan: async (id: number) => {
    return await request.delete({ url: '/mes/wm/stocktaking-plan/delete?id=' + id })
  },

  exportStockTakingPlan: async (params: any) => {
    return await request.download({ url: '/mes/wm/stocktaking-plan/export-excel', params })
  }
}
