export interface TradeOrderPageItemRespVO {
  // 订单编号
  id: number
  // 订单流水号
  no: string
  // 下单时间
  createTime: Date
  // 订单类型
  type: number
  // 订单来源
  terminal: number
  // 用户编号
  userId: number
  // 用户 IP
  userIp: string
  // 用户备注
  userRemark: string
  // 订单状态
  status: number
  // 购买的商品数量
  productCount: number
  // 订单完成时间
  finishTime?: Date
  // 订单取消时间
  cancelTime?: Date
  // 取消类型
  cancelType?: number
  // 商家备注
  remark?: string
  // 支付订单编号
  payOrderId: number
  // 是否已支付
  payed: boolean
  // 付款时间
  payTime?: Date
  // 支付渠道
  payChannelCode: string
  // 商品原价（总）
  originalPrice: number
  // 订单原价（总）
  orderPrice: number
  // 订单优惠（总）
  discountPrice: number
  // 运费金额
  deliveryPrice: number
  // 订单调价（总）
  adjustPrice: number
  // 应付金额（总）
  payPrice: number
  // 配送模板编号
  deliveryTemplateId?: number
  // 发货物流公司编号
  logisticsId?: number
  // 发货物流单号
  logisticsNo?: string
  // 发货状态
  deliveryStatus: number
  // 发货时间
  deliveryTime?: Date
  // 收货时间
  receiveTime?: Date
  // 收件人名称
  receiverName: string
  // 收件人手机
  receiverMobile: string
  // 收件人地区编号
  receiverAreaId: number
  // 收件人邮编
  receiverPostCode: number
  // 收件人详细地址
  receiverDetailAddress: string
  // 售后状态
  afterSaleStatus?: number
  // 退款金额
  refundPrice: number
  // 优惠劵编号
  couponId?: number
  // 优惠劵减免金额
  couponPrice: number
  // 积分抵扣的金额
  pointPrice: number
  //收件人地区名字
  receiverAreaName: string
  // 订单项列表
  items: TradeOrderItemBaseVO[]
}

/**
 * 交易订单项 Base VO，提供给添加、修改、详细的子 VO 使用
 * 如果子 VO 存在差异的字段，请不要添加到这里，影响 Swagger 文档生成
 */
export interface TradeOrderItemBaseVO {
  // ========== 订单项基本信息 ==========
  /**
   * 编号
   */
  id: number
  /**
   * 用户编号
   */
  userId: number
  /**
   * 订单编号
   */
  orderId: number
  // ========== 商品基本信息 ==========
  /**
   * 商品 SPU 编号
   */
  spuId: number
  /**
   * 商品 SPU 名称
   */
  spuName: string
  /**
   * 商品 SKU 编号
   */
  skuId: number
  /**
   * 商品图片
   */
  picUrl: string
  /**
   * 购买数量
   */
  count: number
  // ========== 价格 + 支付基本信息 ==========
  /**
   * 商品原价（总）
   */
  originalPrice: number
  /**
   * 商品原价（单）
   */
  originalUnitPrice: number
  /**
   * 商品优惠（总）
   */
  discountPrice: number
  /**
   * 商品实付金额（总）
   */
  payPrice: number
  /**
   * 子订单分摊金额（总）
   */
  orderPartPrice: number
  /**
   * 分摊后子订单实付金额（总）
   */
  orderDividePrice: number
  // ========== 营销基本信息 ==========
  // TODO 芋艿：在捉摸一下
  // ========== 售后基本信息 ==========
  /**
   * 售后状态
   */
  afterSaleStatus: number
  //属性数组
  properties: ProductPropertyValueDetailRespVO[]
}

/**
 * 管理后台 - 商品属性值的明细 Response VO
 */
export interface ProductPropertyValueDetailRespVO {
  /**
   * 属性的编号
   */
  propertyId: number
  /**
   * 属性的名称
   */
  propertyName: string
  /**
   * 属性值的编号
   */
  valueId: number
  /**
   * 属性值的名称
   */
  valueName: string
}
