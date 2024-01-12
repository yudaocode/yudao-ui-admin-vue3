import request from '@/config/axios'

export interface Property {
  propertyId?: number // 属性编号
  propertyName?: string // 属性名称
  valueId?: number // 属性值编号
  valueName?: string // 属性值名称
}

export interface Sku {
  id?: number // 商品 SKU 编号
  name?: string // 商品 SKU 名称
  spuId?: number // SPU 编号
  properties?: Property[] // 属性数组
  price?: number | string // 商品价格
  marketPrice?: number | string // 市场价
  costPrice?: number | string // 成本价
  barCode?: string // 商品条码
  picUrl?: string // 图片地址
  stock?: number // 库存
  weight?: number // 商品重量，单位：kg 千克
  volume?: number // 商品体积，单位：m^3 平米
  firstBrokeragePrice?: number | string // 一级分销的佣金
  secondBrokeragePrice?: number | string // 二级分销的佣金
  salesCount?: number // 商品销量
}

export interface GiveCouponTemplate {
  id?: number
  name?: string // 优惠券名称
}

export interface Spu {
  id?: number
  name?: string // 商品名称
  categoryId?: number // 商品分类
  keyword?: string // 关键字
  unit?: number | undefined // 单位
  picUrl?: string // 商品封面图
  sliderPicUrls?: string[] // 商品轮播图
  introduction?: string // 商品简介
  deliveryTypes?: number[] // 配送方式
  deliveryTemplateId?: number | undefined // 运费模版
  brandId?: number // 商品品牌编号
  specType?: boolean // 商品规格
  subCommissionType?: boolean // 分销类型
  skus?: Sku[] // sku数组
  description?: string // 商品详情
  sort?: number // 商品排序
  giveIntegral?: number // 赠送积分
  virtualSalesCount?: number // 虚拟销量
  price?: number // 商品价格
  salesCount?: number // 商品销量
  marketPrice?: number // 市场价
  costPrice?: number // 成本价
  stock?: number // 商品库存
  createTime?: Date // 商品创建时间
  status?: number // 商品状态
}

// 获得 Spu 列表
export const getSpuPage = (params: PageParam) => {
  return request.get({ url: '/product/spu/page', params })
}

// 获得 Spu 列表 tabsCount
export const getTabsCount = () => {
  return request.get({ url: '/product/spu/get-count' })
}

// 创建商品 Spu
export const createSpu = (data: Spu) => {
  return request.post({ url: '/product/spu/create', data })
}

// 更新商品 Spu
export const updateSpu = (data: Spu) => {
  return request.put({ url: '/product/spu/update', data })
}

// 更新商品 Spu status
export const updateStatus = (data: { id: number; status: number }) => {
  return request.put({ url: '/product/spu/update-status', data })
}

// 获得商品 Spu
export const getSpu = (id: number) => {
  return request.get({ url: `/product/spu/get-detail?id=${id}` })
}

// 获得商品 Spu 详情列表
export const getSpuDetailList = (ids: number[]) => {
  return request.get({ url: `/product/spu/list?spuIds=${ids}` })
}

// 删除商品 Spu
export const deleteSpu = (id: number) => {
  return request.delete({ url: `/product/spu/delete?id=${id}` })
}

// 导出商品 Spu Excel
export const exportSpu = async (params) => {
  return await request.download({ url: '/product/spu/export', params })
}

// 获得商品 SPU 精简列表
export const getSpuSimpleList = async () => {
  return request.get({ url: '/product/spu/list-all-simple' })
}
