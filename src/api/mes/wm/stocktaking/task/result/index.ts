import request from '@/config/axios'

export interface StockTakingResultVO {
  id?: number
  taskId?: number
  lineId?: number
  materialStockId?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  batchId?: number
  batchCode?: string
  warehouseId?: number
  warehouseName?: string
  locationId?: number
  locationName?: string
  areaId?: number
  areaName?: string
  quantity?: number
  remark?: string
  createTime?: string
}

export const StockTakingResultApi = {
  getStockTakingResultPage: async (params: any) => {
    return await request.get({ url: '/mes/wm/stocktaking-task-result/page', params })
  },

  getStockTakingResult: async (id: number) => {
    return await request.get({ url: '/mes/wm/stocktaking-task-result/get', params: { id } })
  },

  createStockTakingResult: async (data: StockTakingResultVO) => {
    return await request.post({ url: '/mes/wm/stocktaking-task-result/create', data })
  },

  updateStockTakingResult: async (data: StockTakingResultVO) => {
    return await request.put({ url: '/mes/wm/stocktaking-task-result/update', data })
  },

  deleteStockTakingResult: async (id: number) => {
    return await request.delete({ url: '/mes/wm/stocktaking-task-result/delete?id=' + id })
  }
}
