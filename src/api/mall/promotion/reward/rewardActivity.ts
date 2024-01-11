import request from '@/config/axios'

export interface DiscountActivityVO {
  id?: number
  name?: string
  startTime?: Date
  endTime?: Date
  remark?: string
  conditionType?: number
  productScope?: number
  productSpuIds?: number[]
  rules?: DiscountProductVO[]
}

// 优惠规则
export interface DiscountProductVO {
  limit: number
  discountPrice: number
  freeDelivery: boolean
  point: number
  couponIds: number[]
  couponCounts: number[]
}

// 新增满减送活动
export const createRewardActivity = async (data: DiscountActivityVO) => {
  return await request.post({ url: '/promotion/reward-activity/create', data })
}

// 更新满减送活动
export const updateRewardActivity = async (data: DiscountActivityVO) => {
  return await request.put({ url: '/promotion/reward-activity/update', data })
}

// 查询满减送活动列表
export const getRewardActivityPage = async (params) => {
  return await request.get({ url: '/promotion/reward-activity/page', params })
}

// 查询满减送活动详情
export const getReward = async (id: number) => {
  return await request.get({ url: '/promotion/reward-activity/get?id=' + id })
}

// 删除限时折扣活动
export const deleteRewardActivity = async (id: number) => {
  return await request.delete({ url: '/promotion/reward-activity/delete?id=' + id })
}
