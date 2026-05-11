import request from '@/config/axios'

// WMS 库存明细 VO
export interface InventoryDetailVO {
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
  areaId?: number
  areaName?: string
  quantity?: number
  remainQuantity?: number
  batchNo?: string
  productionDate?: Date
  expirationDate?: Date
  amount?: number
  remark?: string
  orderId?: number
  orderNo?: string
  orderType?: number
  createTime?: Date
}

// WMS 库存明细 API
export const InventoryDetailApi = {
  // 查询库存明细分页
  getInventoryDetailPage: async (params: any) => {
    return await request.get({ url: '/wms/inventory-detail/page', params })
  }
}
