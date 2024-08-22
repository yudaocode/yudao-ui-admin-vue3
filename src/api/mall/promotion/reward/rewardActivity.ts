import request from '@/config/axios'

export interface RewardActivityVO {
  id?: number
  name?: string
  startTime?: Date
  endTime?: Date
  startAndEndTime?: Date[] // 只前端使用
  remark?: string
  conditionType?: number
  productScope?: number
  productScopeValues?: number[] // 商品范围：值为 品类编号列表 或 商品编号列表 ，用于提交
  productCategoryIds?: number[] // 仅用于表单，不提交
  productSpuIds?: number[] // 仅用于表单，不提交
  rules?: RewardRule[]
}

// 优惠规则
export interface RewardRule {
  limit?: number
  discountPrice?: number
  freeDelivery?: boolean
  givePoint?: boolean
  point?: number
  giveCoupon?: boolean
  couponIds?: number[]
  couponCounts?: number[]
}

// 新增满减送活动
export const createRewardActivity = async (data: RewardActivityVO) => {
  return await request.post({ url: '/promotion/reward-activity/create', data })
}

// 更新满减送活动
export const updateRewardActivity = async (data: RewardActivityVO) => {
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
