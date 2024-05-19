import request from '@/config/axios'

export interface OrderVO {
  // ========== 订单基本信息 ==========
  id?: number | null // 订单编号
  no?: string // 订单流水号
  createTime?: Date | null // 下单时间
  type?: number | null // 订单类型
  terminal?: number | null // 订单来源
  userId?: number | null // 用户编号
  userIp?: string // 用户 IP
  userRemark?: string // 用户备注
  status?: number | null // 订单状态
  productCount?: number | null // 购买的商品数量
  finishTime?: Date | null // 订单完成时间
  cancelTime?: Date | null // 订单取消时间
  cancelType?: number | null // 取消类型
  remark?: string // 商家备注

  // ========== 价格 + 支付基本信息 ==========
  payOrderId?: number | null // 支付订单编号
  payStatus?: boolean // 是否已支付
  payTime?: Date | null // 付款时间
  payChannelCode?: string // 支付渠道
  totalPrice?: number | null // 商品原价（总）
  discountPrice?: number | null // 订单优惠（总）
  deliveryPrice?: number | null // 运费金额
  adjustPrice?: number | null // 订单调价（总）
  payPrice?: number | null // 应付金额（总）
  // ========== 收件 + 物流基本信息 ==========
  deliveryType?: number | null // 发货方式
  pickUpStoreId?: number // 自提门店编号
  pickUpVerifyCode?: string // 自提核销码
  deliveryTemplateId?: number | null // 配送模板编号
  logisticsId?: number | null // 发货物流公司编号
  logisticsNo?: string // 发货物流单号
  deliveryTime?: Date | null // 发货时间
  receiveTime?: Date | null // 收货时间
  receiverName?: string // 收件人名称
  receiverMobile?: string // 收件人手机
  receiverPostCode?: number | null // 收件人邮编
  receiverAreaId?: number | null // 收件人地区编号
  receiverAreaName?: string //收件人地区名字
  receiverDetailAddress?: string // 收件人详细地址

  // ========== 售后基本信息 ==========
  afterSaleStatus?: number | null // 售后状态
  refundPrice?: number | null // 退款金额

  // ========== 营销基本信息 ==========
  couponId?: number | null // 优惠劵编号
  couponPrice?: number | null // 优惠劵减免金额
  pointPrice?: number | null // 积分抵扣的金额
  vipPrice?: number | null // VIP 减免金额

  items?: OrderItemRespVO[] // 订单项列表
  // 下单用户信息
  user?: {
    id?: number | null
    nickname?: string
    avatar?: string
  }
  // 推广用户信息
  brokerageUser?: {
    id?: number | null
    nickname?: string
    avatar?: string
  }
  // 订单操作日志
  logs?: OrderLogRespVO[]
}

export interface OrderLogRespVO {
  content?: string
  createTime?: Date
  userType?: number
}

export interface OrderItemRespVO {
  // ========== 订单项基本信息 ==========
  id?: number | null // 编号
  userId?: number | null // 用户编号
  orderId?: number | null // 订单编号
  // ========== 商品基本信息 ==========
  spuId?: number | null // 商品 SPU 编号
  spuName?: string //商品 SPU 名称
  skuId?: number | null // 商品 SKU 编号
  picUrl?: string //商品图片
  count?: number | null //购买数量
  // ========== 价格 + 支付基本信息 ==========
  originalPrice?: number | null //商品原价（总）
  originalUnitPrice?: number | null //商品原价（单）
  discountPrice?: number | null //商品优惠（总）
  payPrice?: number | null //商品实付金额（总）
  orderPartPrice?: number | null //子订单分摊金额（总）
  orderDividePrice?: number | null //分摊后子订单实付金额（总）
  // ========== 营销基本信息 ==========
  // TODO 芋艿：在捉摸一下
  // ========== 售后基本信息 ==========
  afterSaleStatus?: number | null // 售后状态
  properties?: ProductPropertiesVO[] //属性数组
}

export interface ProductPropertiesVO {
  propertyId?: number | null // 属性的编号
  propertyName?: string // 属性的名称
  valueId?: number | null //属性值的编号
  valueName?: string // 属性值的名称
}

/** 交易订单统计 */
export interface TradeOrderSummaryRespVO {
  /** 订单数量 */
  orderCount?: number
  /** 订单金额 */
  orderPayPrice?: string
  /** 退款单数 */
  afterSaleCount?: number
  /** 退款金额 */
  afterSalePrice?: string
}

// 查询交易订单列表
export const getOrderPage = async (params: any) => {
  return await request.get({ url: `/trade/order/page`, params })
}

// 查询交易订单统计
export const getOrderSummary = async (params: any) => {
  return await request.get<TradeOrderSummaryRespVO>({ url: `/trade/order/summary`, params })
}

// 查询交易订单详情
export const getOrder = async (id: number | null) => {
  return await request.get({ url: `/trade/order/get-detail?id=` + id })
}

// 查询交易订单物流详情
export const getExpressTrackList = async (id: number | null) => {
  return await request.get({ url: `/trade/order/get-express-track-list?id=` + id })
}

export interface DeliveryVO {
  id?: number // 订单编号
  logisticsId: number | null // 物流公司编号
  logisticsNo: string // 物流编号
}

// 订单发货
export const deliveryOrder = async (data: DeliveryVO) => {
  return await request.put({ url: `/trade/order/delivery`, data })
}

// 订单备注
export const updateOrderRemark = async (data: any) => {
  return await request.put({ url: `/trade/order/update-remark`, data })
}

// 订单调价
export const updateOrderPrice = async (data: any) => {
  return await request.put({ url: `/trade/order/update-price`, data })
}

// 修改订单地址
export const updateOrderAddress = async (data: any) => {
  return await request.put({ url: `/trade/order/update-address`, data })
}

// 订单核销
export const pickUpOrder = async (id: number) => {
  return await request.put({ url: `/trade/order/pick-up-by-id?id=${id}` })
}

// 订单核销
export const pickUpOrderByVerifyCode = async (pickUpVerifyCode: string) => {
  return await request.put({
    url: `/trade/order/pick-up-by-verify-code`,
    params: { pickUpVerifyCode }
  })
}

// 查询核销码对应的订单
export const getOrderByPickUpVerifyCode = async (pickUpVerifyCode: string) => {
  return await request.get<OrderVO>({
    url: `/trade/order/get-by-pick-up-verify-code`,
    params: { pickUpVerifyCode }
  })
}
