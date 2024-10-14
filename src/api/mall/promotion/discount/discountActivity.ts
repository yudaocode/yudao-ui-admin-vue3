import request from '@/config/axios'
import { Sku, Spu } from '@/api/mall/product/spu'

export interface DiscountActivityVO {
  id?: number
  spuId?: number
  name?: string
  status?: number
  remark?: string
  startTime?: Date
  endTime?: Date
  products?: DiscountProductVO[]
}
// 限时折扣相关 属性
export interface DiscountProductVO {
  spuId: number
  skuId: number
  discountType: number
  discountPercent: number
  discountPrice: number
}

// 扩展 Sku 配置
export type SkuExtension = Sku & {
  productConfig: DiscountProductVO
}

export interface SpuExtension extends Spu {
  skus: SkuExtension[] // 重写类型
}

// 查询限时折扣活动列表
export const getDiscountActivityPage = async (params) => {
  return await request.get({ url: '/promotion/discount-activity/page', params })
}

// 查询限时折扣活动详情
export const getDiscountActivity = async (id: number) => {
  return await request.get({ url: '/promotion/discount-activity/get?id=' + id })
}

// 新增限时折扣活动
export const createDiscountActivity = async (data: DiscountActivityVO) => {
  return await request.post({ url: '/promotion/discount-activity/create', data })
}

// 修改限时折扣活动
export const updateDiscountActivity = async (data: DiscountActivityVO) => {
  return await request.put({ url: '/promotion/discount-activity/update', data })
}

// 关闭限时折扣活动
export const closeDiscountActivity = async (id: number) => {
  return await request.put({ url: '/promotion/discount-activity/close?id=' + id })
}

// 删除限时折扣活动
export const deleteDiscountActivity = async (id: number) => {
  return await request.delete({ url: '/promotion/discount-activity/delete?id=' + id })
}
