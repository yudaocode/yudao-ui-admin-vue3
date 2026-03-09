import request from '@/config/axios'

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

// TODO @AI：可能不需要这个；
export interface StockTakingTaskLineBatchUpdateReqVO {
  taskId: number
  items: Array<{
    id: number
    takingQuantity: number
    remark?: string
  }>
}

export const StockTakingTaskLineApi = {
  getStockTakingTaskLineList: async (taskId: number) => {
    return await request.get({ url: '/mes/wm/stocktaking-task/line-list?taskId=' + taskId })
  },

  batchUpdateStockTakingTaskLines: async (data: StockTakingTaskLineBatchUpdateReqVO) => {
    return await request.put({ url: '/mes/wm/stocktaking-task/line-batch-update', data })
  }
}
