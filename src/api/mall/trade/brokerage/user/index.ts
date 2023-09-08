import request from '@/config/axios'

export interface BrokerageUserVO {
  id: number
  brokerageUserId: number
  brokerageBindTime: Date
  brokerageEnabled: boolean
  brokerageTime: Date
  brokeragePrice: number
  frozenBrokeragePrice: number
}

// 查询分销用户列表
export const getBrokerageUserPage = async (params: any) => {
  return await request.get({ url: `/trade/brokerage-user/page`, params })
}

// 查询分销用户详情
export const getBrokerageUser = async (id: number) => {
  return await request.get({ url: `/trade/brokerage-user/get?id=` + id })
}
