import request from '@/config/axios'

export interface PayDemoWithdrawVO {
  id?: number
  subject: string
  price: number
  userName: string
  userAccount: string
  type: number
  status?: number
  payTransferId?: number
  transferChannelCode?: string
  transferTime?: Date
  transferErrorMsg?: string
}

// 查询示例提现单列表
export const getDemoWithdrawPage = (params: PageParam) => {
  return request.get({ url: '/pay/demo-withdraw/page', params })
}

// 创建示例提现单
export const createDemoWithdraw = (data: PayDemoWithdrawVO) => {
  return request.post({ url: '/pay/demo-withdraw/create', data })
}

// 发起提现单转账
export const transferDemoWithdraw = (id: number) => {
  return request.post({ url: '/pay/demo-withdraw/transfer', params: { id } })
}
