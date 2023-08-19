import request from '@/config/axios'

export interface OrderVO {
  id?: number // 订单编号
  no?: string // 订单流水号
  createTime?: Date // 下单时间
  type?: number // 订单类型
  terminal?: number // 订单来源
  userId?: number // 用户编号
  userIp?: string // 用户 IP
  userRemark?: string // 用户备注
  status?: number // 订单状态
  productCount?: number // 购买的商品数量
  finishTime?: Date // 订单完成时间
  cancelTime?: Date // 订单取消时间
  cancelType?: number // 取消类型
  remark?: string // 商家备注
  payOrderId: number // 支付订单编号
  payed?: boolean // 是否已支付
  payTime?: Date // 付款时间
  payChannelCode?: string // 支付渠道
  originalPrice?: number // 商品原价（总）
  orderPrice?: number // 订单原价（总）
  discountPrice?: number // 订单优惠（总）
  deliveryPrice?: number // 运费金额
  adjustPrice?: number // 订单调价（总）
  payPrice?: number // 应付金额（总）
  deliveryType?: number // 发货方式
  deliveryTemplateId?: number // 配送模板编号
  logisticsId?: number // 发货物流公司编号
  logisticsNo?: string // 发货物流单号
  deliveryStatus?: number // 发货状态
  deliveryTime?: Date // 发货时间
  receiveTime?: Date // 收货时间
  receiverName?: string // 收件人名称
  receiverMobile?: string // 收件人手机
  receiverAreaId?: number // 收件人地区编号
  receiverPostCode?: number // 收件人邮编
  receiverDetailAddress?: string // 收件人详细地址
  afterSaleStatus?: number // 售后状态
  refundPrice?: number // 退款金额
  couponId?: number // 优惠劵编号
  couponPrice?: number // 优惠劵减免金额
  pointPrice?: number // 积分抵扣的金额
  receiverAreaName?: string //收件人地区名字
  items?: OrderItemRespVO[] // 订单项列表
  //用户信息
  user?: {
    id?: number
    nickname?: string
    avatar?: string
  }
}

export interface OrderItemRespVO {
  // ========== 订单项基本信息 ==========
  id?: number // 编号
  userId?: number // 用户编号
  orderId?: number // 订单编号
  // ========== 商品基本信息 ==========
  spuId?: number // 商品 SPU 编号
  spuName?: string //商品 SPU 名称
  skuId?: number // 商品 SKU 编号
  picUrl?: string //商品图片
  count?: number //购买数量
  // ========== 价格 + 支付基本信息 ==========
  originalPrice?: number //商品原价（总）
  originalUnitPrice?: number //商品原价（单）
  discountPrice?: number //商品优惠（总）
  payPrice?: number //商品实付金额（总）
  orderPartPrice?: number //子订单分摊金额（总）
  orderDividePrice?: number //分摊后子订单实付金额（总）
  // ========== 营销基本信息 ==========
  // TODO 芋艿：在捉摸一下
  // ========== 售后基本信息 ==========
  afterSaleStatus?: number // 售后状态
  properties?: ProductPropertiesVO[] //属性数组
}

export interface ProductPropertiesVO {
  propertyId?: number // 属性的编号
  propertyName?: string // 属性的名称
  valueId?: number //属性值的编号
  valueName?: string // 属性值的名称
}

// 查询交易订单列表
export const getOrderPage = async (params) => {
  return await request.get({ url: `/trade/order/page`, params })
}

// 查询交易订单详情
export const getOrder = async (id: number) => {
  return await request.get({ url: `/trade/order/get?id=` + id })
}

// 新增交易订单
export const createOrder = async (data: OrderVO) => {
  return await request.post({ url: `/trade/order/create`, data })
}

// 修改交易订单
export const updateOrder = async (data: OrderVO) => {
  return await request.put({ url: `/trade/order/update`, data })
}

// 删除交易订单
export const deleteOrder = async (id: number) => {
  return await request.delete({ url: `/trade/order/delete?id=` + id })
}
