import request from '@/config/axios'

// WMS 库存记录 VO
export interface InventoryHistoryVO {
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
  beforeQuantity?: number
  afterQuantity?: number
  price?: number
  totalPrice?: number
  remark?: string
  orderId?: number
  orderNo?: string
  orderType?: number
  createTime?: Date
}

// WMS 库存记录 API
export const InventoryHistoryApi = {
  // 查询库存记录分页
  getInventoryHistoryPage: async (params: any) => {
    return await request.get({ url: '/wms/inventory-history/page', params })
  }
}
