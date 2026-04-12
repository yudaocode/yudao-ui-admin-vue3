import request from '@/config/axios'

export interface StockTakingTaskLineVO {
  id?: number
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

export const StockTakingTaskLineApi = {
  getStockTakingTaskLinePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/stocktaking-task-line/page', params })
  },

  getStockTakingTaskLineSimpleList: async (taskId: number) => {
    return await request.get({
      url: '/mes/wm/stocktaking-task-line/simple-list',
      params: { taskId }
    })
  },

  getStockTakingTaskLine: async (id: number) => {
    return await request.get({ url: '/mes/wm/stocktaking-task-line/get', params: { id } })
  },

  createStockTakingTaskLine: async (data: StockTakingTaskLineVO) => {
    return await request.post({ url: '/mes/wm/stocktaking-task-line/create', data })
  },

  updateStockTakingTaskLine: async (data: StockTakingTaskLineVO) => {
    return await request.put({ url: '/mes/wm/stocktaking-task-line/update', data })
  },

  deleteStockTakingTaskLine: async (id: number) => {
    return await request.delete({ url: '/mes/wm/stocktaking-task-line/delete?id=' + id })
  }
}

export interface StockTakingTaskLineSimpleVO {
  id: number
  itemId: number
  itemCode: string
  itemName: string
  specification?: string
  unitMeasureName?: string
  batchCode?: string
  warehouseId: number
  warehouseName: string
  locationId?: number
  locationName?: string
  areaId?: number
  areaName?: string
  quantity: number
}
