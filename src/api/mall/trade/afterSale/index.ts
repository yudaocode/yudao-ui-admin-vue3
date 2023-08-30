import request from '@/config/axios'

export interface TradeAfterSaleVO {
  id?: number | null // 售后编号，主键自增
  no?: string // 售后单号
  status?: number | null // 退款状态
  way?: number | null // 售后方式
  type?: number | null // 售后类型
  userId?: number | null // 用户编号
  applyReason?: string // 申请原因
  applyDescription?: string // 补充描述
  applyPicUrls?: string[] // 补充凭证图片
  orderId?: number | null // 交易订单编号
  orderNo?: string // 订单流水号
  orderItemId?: number | null // 交易订单项编号
  spuId?: number | null // 商品 SPU 编号
  spuName?: string // 商品 SPU 名称
  skuId?: number | null // 商品 SKU 编号
  properties?: ProductPropertiesVO[] // 属性数组
  picUrl?: string // 商品图片
  count?: number | null // 退货商品数量
  auditTime?: Date // 审批时间
  auditUserId?: number | null // 审批人
  auditReason?: string // 审批备注
  refundPrice?: number | null // 退款金额，单位：分。
  payRefundId?: number | null // 支付退款编号
  refundTime?: Date // 退款时间
  logisticsId?: number | null // 退货物流公司编号
  logisticsNo?: string // 退货物流单号
  deliveryTime?: Date // 退货时间
  receiveTime?: Date // 收货时间
  receiveReason?: string // 收货备注
}

export interface ProductPropertiesVO {
  propertyId?: number | null // 属性的编号
  propertyName?: string // 属性的名称
  valueId?: number | null //属性值的编号
  valueName?: string // 属性值的名称
}

// 获得交易售后分页
export const getAfterSalePage = async (params) => {
  return await request.get({ url: `/trade/after-sale/page`, params })
}

// 获得交易售后详情
export const getAfterSale = async (id: any) => {
  return await request.get({ url: `/trade/after-sale/get-detail?id=${id}` })
}

// 同意售后
export const agree = async (id: any) => {
  return await request.put({ url: `/trade/after-sale/agree?id=${id}` })
}

// 拒绝售后
export const disagree = async (data: any) => {
  return await request.put({ url: `/trade/after-sale/disagree`, data })
}

// 确认收货
export const receive = async (id: any) => {
  return await request.put({ url: `/trade/after-sale/receive?id=${id}` })
}

// 拒绝收货
export const refuse = async (id: any) => {
  return await request.put({ url: `/trade/after-sale/refuse?id=${id}` })
}

// 确认退款
export const refund = async (id: any) => {
  return await request.put({ url: `/trade/after-sale/refund?id=${id}` })
}
