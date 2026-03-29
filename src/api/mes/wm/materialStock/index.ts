import request from '@/config/axios'

// MES 库存台账 VO
export interface WmMaterialStockVO {
  id: number
  itemTypeId: number
  itemId: number
  itemCode: string
  itemName: string
  specification: string
  unitMeasureName: string
  batchId: number
  batchCode: string
  warehouseId: number
  warehouseName: string
  locationId: number
  locationName: string
  areaId: number
  areaName: string
  vendorId: number
  vendorName: string
  quantity: number
  receiptTime: string
  frozen: boolean
  createTime: string
}

// MES 库存台账 API
export const WmMaterialStockApi = {
  // 查询库存台账分页
  getMaterialStockPage: async (params: any) => {
    return await request.get({ url: '/mes/wm/material-stock/page', params })
  },

  // 查询库存记录详情
  getMaterialStock: async (id: number) => {
    return await request.get({ url: '/mes/wm/material-stock/get?id=' + id })
  },

  // 更新库存冻结状态
  updateMaterialStockFrozen: async (data: { id: number; frozen: boolean }) => {
    return await request.put({ url: '/mes/wm/material-stock/update-frozen', data })
  },

  // 导出库存台账 Excel
  exportMaterialStock: async (params: any) => {
    return await request.download({ url: '/mes/wm/material-stock/export-excel', params })
  },

  // 获取库存精简列表（主要用于前端下拉，可按 itemId 过滤）
  getMaterialStockSimpleList: async (itemId?: number) => {
    return await request.get({
      url: '/mes/wm/material-stock/simple-list',
      params: { itemId }
    })
  }
}
