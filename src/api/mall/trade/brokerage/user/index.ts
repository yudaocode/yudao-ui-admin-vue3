import request from '@/config/axios'

export interface BrokerageUserVO {
  id: number
  bindUserId: number
  bindUserTime: Date
  brokerageEnabled: boolean
  brokerageTime: Date
  price: number
  frozenPrice: number

  nickname: string
  avatar: string
}

// 创建分销用户
export const createBrokerageUser = (data: any) => {
  return request.post({ url: '/trade/brokerage-user/create', data })
}

// 查询分销用户列表
export const getBrokerageUserPage = async (params: any) => {
  return await request.get({ url: `/trade/brokerage-user/page`, params })
}

// 查询分销用户详情
export const getBrokerageUser = async (id: number) => {
  return await request.get({ url: `/trade/brokerage-user/get?id=` + id })
}

// 修改推广员
export const updateBindUser = async (data: any) => {
  return await request.put({ url: `/trade/brokerage-user/update-bind-user`, data })
}

// 清除推广员
export const clearBindUser = async (data: any) => {
  return await request.put({ url: `/trade/brokerage-user/clear-bind-user`, data })
}

// 修改推广资格
export const updateBrokerageEnabled = async (data: any) => {
  return await request.put({ url: `/trade/brokerage-user/update-brokerage-enable`, data })
}
