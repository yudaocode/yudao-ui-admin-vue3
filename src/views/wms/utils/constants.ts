/** 单据状态枚举 */
export const OrderStatusEnum = {
  PREPARE: 0, // 草稿
  FINISHED: 4, // 已完成
  CANCELED: 5 // 已作废
} as const

/** 往来企业类型枚举 */
export const MerchantTypeEnum = {
  CUSTOMER: 1, // 客户
  SUPPLIER: 2, // 供应商
  CUSTOMER_SUPPLIER: 3 // 客户/供应商
} as const

/** 供应商类型的往来企业 */
export const SupplierMerchantTypeList = [
  MerchantTypeEnum.SUPPLIER,
  MerchantTypeEnum.CUSTOMER_SUPPLIER
]
