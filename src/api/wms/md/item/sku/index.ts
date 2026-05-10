// WMS 商品 SKU VO
export interface ItemSkuVO {
  id?: number
  name?: string
  itemId?: number
  itemCode?: string
  itemName?: string
  categoryId?: number
  categoryName?: string
  unit?: string
  brandId?: number
  brandName?: string
  barCode?: string
  code?: string
  length?: number
  width?: number
  height?: number
  grossWeight?: number
  netWeight?: number
  costPrice?: number
  sellingPrice?: number
  createTime?: Date
}
