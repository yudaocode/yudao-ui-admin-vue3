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

  getStockTakingResultList: async (taskId: number) => {
    return await request.get({ url: '/mes/wm/stocktaking-task-result/list?taskId=' + taskId })
  },

  exportStockTakingResult: async (params: any) => {
    return await request.download({ url: '/mes/wm/stocktaking-task-result/export-excel', params })
  }
}
