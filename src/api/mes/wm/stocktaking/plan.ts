import request from '@/config/axios'

// TODO @AI：原则是 plan、task 两个目录；然后每个目录里，index.ts 都只能；param/index.ts 这样；
export interface StockTakingPlanParamVO {
  id?: number
  planId?: number
  type?: number
  valueId?: number | string
  valueCode?: string
  valueName?: string
  remark?: string
}

export interface StockTakingPlanVO {
  id?: number
  code?: string
  name?: string
  type?: number
  startTime?: string
  endTime?: string
  blindFlag?: boolean
  frozenFlag?: boolean
  enableFlag?: boolean
  status?: number
  remark?: string
  params?: StockTakingPlanParamVO[]
  createTime?: string
}

export interface StockTakingPlanGenerateReqVO {
  planId: number
  code: string
  name: string
  takingDate?: string
  userId: number
  remark?: string
  params?: StockTakingPlanParamVO[]
}

export const StockTakingPlanApi = {
  getStockTakingPlanPage: async (params: any) => {
    return await request.get({ url: '/mes/wm/stocktaking-plan/page', params })
  },

  getStockTakingPlan: async (id: number) => {
    return await request.get({ url: '/mes/wm/stocktaking-plan/get?id=' + id })
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

  confirmStockTakingPlan: async (id: number) => {
    return await request.put({ url: '/mes/wm/stocktaking-plan/confirm?id=' + id })
  },

  generateStockTakingTask: async (data: StockTakingPlanGenerateReqVO) => {
    return await request.post({ url: '/mes/wm/stocktaking-plan/generate-task', data })
  },

  exportStockTakingPlan: async (params: any) => {
    return await request.download({ url: '/mes/wm/stocktaking-plan/export-excel', params })
  }
}
