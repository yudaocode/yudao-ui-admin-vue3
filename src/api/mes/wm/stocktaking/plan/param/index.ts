import request from '@/config/axios'

export interface StockTakingPlanParamVO {
  id?: number
  planId?: number
  type?: number
  valueId?: number | string
  valueCode?: string
  valueName?: string
  remark?: string
}

export const StockTakingPlanParamApi = {
  getStockTakingPlanParam: async (id: number) => {
    return await request.get({ url: '/mes/wm/stocktaking-plan-param/get?id=' + id })
  },

  getStockTakingPlanParamPage: async (params: any) => {
    return await request.get({ url: '/mes/wm/stocktaking-plan-param/page', params })
  },

  createStockTakingPlanParam: async (data: StockTakingPlanParamVO) => {
    return await request.post({ url: '/mes/wm/stocktaking-plan-param/create', data })
  },

  updateStockTakingPlanParam: async (data: StockTakingPlanParamVO) => {
    return await request.put({ url: '/mes/wm/stocktaking-plan-param/update', data })
  },

  deleteStockTakingPlanParam: async (id: number) => {
    return await request.delete({ url: '/mes/wm/stocktaking-plan-param/delete?id=' + id })
  }
}
