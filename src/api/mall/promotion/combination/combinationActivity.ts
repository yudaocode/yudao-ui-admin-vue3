import request from '@/config/axios'
import { Sku, Spu } from '@/api/mall/product/spu'

export interface CombinationActivityVO {
  id?: number
  name?: string
  spuId?: number
  totalLimitCount?: number
  singleLimitCount?: number
  startTime?: Date
  endTime?: Date
  userSize?: number
  totalCount?: number
  successCount?: number
  orderUserCount?: number
  virtualGroup?: number
  status?: number
  limitDuration?: number
  products: CombinationProductVO[]
}

// 拼团活动所需属性
export interface CombinationProductVO {
  spuId: number
  skuId: number
  combinationPrice: number // 拼团价格
}

// 扩展 Sku 配置
export type SkuExtension = Sku & {
  productConfig: CombinationProductVO
}

export interface SpuExtension extends Spu {
  skus: SkuExtension[] // 重写类型
}

// 查询拼团活动列表
export const getCombinationActivityPage = async (params) => {
  return await request.get({ url: '/promotion/combination-activity/page', params })
}

// 查询拼团活动详情
export const getCombinationActivity = async (id: number) => {
  return await request.get({ url: '/promotion/combination-activity/get?id=' + id })
}

// 新增拼团活动
export const createCombinationActivity = async (data: CombinationActivityVO) => {
  return await request.post({ url: '/promotion/combination-activity/create', data })
}

// 修改拼团活动
export const updateCombinationActivity = async (data: CombinationActivityVO) => {
  return await request.put({ url: '/promotion/combination-activity/update', data })
}

// 关闭拼团活动
export const closeCombinationActivity = async (id: number) => {
  return await request.put({ url: '/promotion/combination-activity/close?id=' + id })
}

// 删除拼团活动
export const deleteCombinationActivity = async (id: number) => {
  return await request.delete({ url: '/promotion/combination-activity/delete?id=' + id })
}
