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
  areaId?: number
  areaName?: string
  batchNo?: string
  productionDate?: Date
  expirationDate?: Date
  quantity?: number
  availableQuantity?: number
  amount?: number
  remark?: string
  createTime?: Date
}
