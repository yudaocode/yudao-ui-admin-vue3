import request from '@/config/axios'

export interface StockTakingTaskVO {
  id?: number
  code?: string
  name?: string
  takingDate?: string
  type?: number
  userId?: number
  userNickname?: string
  planId?: number
  planCode?: string
  planName?: string
  blindFlag?: boolean
  frozenFlag?: boolean
  startTime?: string
  endTime?: string
  status?: number
  remark?: string
  createTime?: string
}

export const StockTakingApi = {
  getStockTakingPage: async (params: any) => {
    return await request.get({ url: '/mes/wm/stocktaking-task/page', params })
  },

  getStockTaking: async (id: number) => {
    return await request.get({ url: '/mes/wm/stocktaking-task/get?id=' + id })
  },

  createStockTaking: async (data: StockTakingTaskVO) => {
    return await request.post({ url: '/mes/wm/stocktaking-task/create', data })
  },

  updateStockTaking: async (data: StockTakingTaskVO) => {
    return await request.put({ url: '/mes/wm/stocktaking-task/update', data })
  },

  deleteStockTaking: async (id: number) => {
    return await request.delete({ url: '/mes/wm/stocktaking-task/delete?id=' + id })
  },

  submitStockTaking: async (id: number) => {
    return await request.put({ url: '/mes/wm/stocktaking-task/submit', params: { id } })
  },

  cancelStockTaking: async (id: number) => {
    return await request.put({ url: '/mes/wm/stocktaking-task/cancel', params: { id } })
  },

  exportStockTaking: async (params: any) => {
    return await request.download({ url: '/mes/wm/stocktaking-task/export-excel', params })
  }
}
