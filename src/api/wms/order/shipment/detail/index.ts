// WMS 出库单明细 VO
export interface ShipmentOrderDetailVO {
  id?: number
  orderId?: number
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
  availableQuantity?: number
  price?: number
  totalPrice?: number
  createTime?: Date
}
