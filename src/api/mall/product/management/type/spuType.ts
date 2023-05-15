import { SkuType } from './skuType'

export interface SpuType {
  id?: number
  name?: string // 商品名称
  categoryId?: number | null // 商品分类
  keyword?: string // 关键字
  unit?: number | null // 单位
  picUrl?: string // 商品封面图
  sliderPicUrls?: string[] // 商品轮播图
  introduction?: string // 商品简介
  deliveryTemplateId?: number // 运费模版
  specType?: boolean // 商品规格
  subCommissionType?: boolean // 分销类型
  skus: SkuType[] // sku数组
  description?: string // 商品详情
  sort?: string // 商品排序
  giveIntegral?: number // 赠送积分
  virtualSalesCount?: number // 虚拟销量
  recommendHot?: boolean // 是否热卖
  recommendBenefit?: boolean // 是否优惠
  recommendBest?: boolean // 是否精品
  recommendNew?: boolean // 是否新品
  recommendGood?: boolean // 是否优品
}
