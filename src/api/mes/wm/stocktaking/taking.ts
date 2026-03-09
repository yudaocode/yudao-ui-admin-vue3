import request from '@/config/axios'

// TODO @AI：原则是 plan、task 两个目录；然后每个目录里，index.ts 都只能；param/index.ts 这样；
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
  snapshotTime?: string
  startTime?: string
  endTime?: string
  status?: number
  adjustedFlag?: boolean
  remark?: string
  createTime?: string
}

export interface StockTakingTaskLineVO {
  id: number
  taskId: number
  materialStockId?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  batchId?: number
  batchCode?: string
  quantity?: number
  takingQuantity?: number
  differenceQuantity?: number
  warehouseId?: number
  warehouseName?: string
  locationId?: number
  locationName?: string
  areaId?: number
  areaName?: string
  status?: number
  remark?: string
}

export interface StockTakingTaskLineBatchUpdateReqVO {
  taskId: number
  items: Array<{
    id: number
    takingQuantity: number
    remark?: string
  }>
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

  startStockTaking: async (id: number) => {
    return await request.put({ url: '/mes/wm/stocktaking-task/start?id=' + id })
  },

  finishStockTaking: async (id: number) => {
    return await request.put({ url: '/mes/wm/stocktaking-task/finish?id=' + id })
  },

  cancelStockTaking: async (id: number) => {
    return await request.put({ url: '/mes/wm/stocktaking-task/cancel?id=' + id })
  },

  getStockTakingLineList: async (taskId: number) => {
    return await request.get({ url: '/mes/wm/stocktaking-task/line-list?taskId=' + taskId })
  },

  batchUpdateStockTakingLines: async (data: StockTakingTaskLineBatchUpdateReqVO) => {
    return await request.put({ url: '/mes/wm/stocktaking-task/line-batch-update', data })
  },

  exportStockTaking: async (params: any) => {
    return await request.download({ url: '/mes/wm/stocktaking-task/export-excel', params })
  }
}
