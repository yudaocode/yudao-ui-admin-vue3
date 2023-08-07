import request from '@/config/axios'
import { Sku, Spu } from '@/api/mall/product/spu'

export interface BargainActivityVO {
  id?: number
  name?: string
  startTime?: Date
  endTime?: Date
  status?: number
  spuId?: number
  userSize?: number // 达到该人数，才能砍到低价
  bargainCount?: number // 最大帮砍次数
  totalLimitCount?: number // 最大购买次数
  stock?: number // 活动总库存
  randomMinPrice?: number // 用户每次砍价的最小金额，单位：分
  randomMaxPrice?: number // 用户每次砍价的最大金额，单位：分
  successCount?: number // 砍价成功数量
  products?: BargainProductVO[]
}

// 砍价活动所需属性
export interface BargainProductVO {
  spuId: number
  skuId: number
  bargainFirstPrice: number // 砍价起始价格，单位分
  bargainPrice: number // 砍价底价
  stock: number // 活动库存
}

// 扩展 Sku 配置
export type SkuExtension = Sku & {
  productConfig: BargainProductVO
}

export interface SpuExtension extends Spu {
  skus: SkuExtension[] // 重写类型
}

// 查询砍价活动列表
export const getBargainActivityPage = async (params: any) => {
  return await request.get({ url: '/promotion/bargain-activity/page', params })
}

// 查询砍价活动详情
export const getBargainActivity = async (id: number) => {
  return await request.get({ url: '/promotion/bargain-activity/get?id=' + id })
}

// 新增砍价活动
export const createBargainActivity = async (data: BargainActivityVO) => {
  return await request.post({ url: '/promotion/bargain-activity/create', data })
}

// 修改砍价活动
export const updateBargainActivity = async (data: BargainActivityVO) => {
  return await request.put({ url: '/promotion/bargain-activity/update', data })
}

// 删除砍价活动
export const deleteBargainActivity = async (id: number) => {
  return await request.delete({ url: '/promotion/bargain-activity/delete?id=' + id })
}
