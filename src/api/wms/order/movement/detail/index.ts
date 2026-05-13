// WMS 移库单明细 VO
export interface MovementOrderDetailVO {
  id?: number
  orderId?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  unit?: string
  skuId?: number
  skuCode?: string
  skuName?: string
  inventoryDetailId?: number
  sourceWarehouseId?: number
  sourceWarehouseName?: string
  sourceAreaId?: number
  sourceAreaName?: string
  targetWarehouseId?: number
  targetWarehouseName?: string
  targetAreaId?: number
  targetAreaName?: string
  batchNo?: string
  productionDate?: Date
  expirationDate?: Date
  quantity?: number
  availableQuantity?: number
  amount?: number
  remark?: string
  createTime?: Date
}
