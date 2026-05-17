/** 单据状态枚举 */
export const OrderStatusEnum = {
  PREPARE: 0, // 草稿
  FINISHED: 4, // 已完成
  CANCELED: 5 // 已作废
} as const

/** 单据类型枚举 */
export const OrderTypeEnum = {
  RECEIPT: 1, // 入库
  SHIPMENT: 2, // 出库
  MOVEMENT: 3, // 移库
  CHECK: 4 // 盘库
} as const

/** 可修改的单据状态 */
export const OrderUpdateStatusList: number[] = [OrderStatusEnum.PREPARE]

/** 可删除的单据状态 */
export const OrderDeleteStatusList: number[] = [OrderStatusEnum.PREPARE, OrderStatusEnum.CANCELED]

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

/** 客户类型的往来企业 */
export const CustomerMerchantTypeList = [
  MerchantTypeEnum.CUSTOMER,
  MerchantTypeEnum.CUSTOMER_SUPPLIER
]

/**
 * 生成 WMS 编号 / 条码。
 *
 * @param prefix 可选前缀，按业务域区分编号种类：
 *   - `I` 商品编号
 *   - `S` SKU 编号
 *   - `W` 仓库编号
 *   - `M` 往来企业编号
 *   - 不传 / 空串 用于 SKU 条码（条码业务习惯纯数字）
 * @returns 前缀 + 8 位随机数字串。
 *
 * 由前端在表单【生成】按钮上调用，避免后端兜底生成造成编号不可控。
 */
export function generateWmsCode(prefix: string = ''): string {
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += Math.floor(Math.random() * 10).toString()
  }
  return prefix + result
}
