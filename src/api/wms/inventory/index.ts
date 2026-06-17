import request from '@/config/axios'

// WMS 库存统计 VO
export interface InventoryVO {
  id?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  unit?: string
  skuId?: number
  skuCode?: string
  skuName?: string
  warehouseId?: number
  warehouseName?: string
  quantity?: number
  remark?: string
  createTime?: Date
}

// WMS 库存统计列表 Request VO
export interface InventoryListReqVO {
  warehouseId: number
}

// WMS 库存统计 API
export const InventoryApi = {
  // 查询库存统计分页
  getInventoryPage: async (params: any) => {
    return await request.get({ url: '/wms/inventory/page', params })
  },

  // 查询库存统计列表
  getInventoryList: async (params: InventoryListReqVO) => {
    return await request.get({ url: '/wms/inventory/list', params })
  }
}
