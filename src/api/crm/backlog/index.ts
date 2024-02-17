import request from '@/config/axios'

import { type CustomerVO } from '../customer'
import { type ClueVO } from '../clue'

// 查询客户列表
// TODO @芋艿：看看是不是后续融合到 getCustomerPage 里；
export const getTodayCustomerPage = async (params) => {
  return await request.get({ url: `/crm/backlog/today-customer-page`, params })
}

// 查询线索列表
export const getFollowLeadsPage = async (params) => {
  return await request.get({ url: `/crm/backlog/page`, params })
}

export { type CustomerVO, type ClueVO }
