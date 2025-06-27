import request from '@/config/axios'

export interface BrokerageWithdrawVO {
  id: number
  userId: number
  price: number
  feePrice: number
  totalPrice: number
  type: number
  userName: string
  userAccount: string
  bankName: string
  bankAddress: string
  qrCodeUrl: string
  status: number
  auditReason: string
  auditTime: Date
  remark: string
  payTransferId?: number
  transferChannelCode?: string
  transferTime?: Date
  transferErrorMsg?: string
}

// 查询佣金提现列表
export const getBrokerageWithdrawPage = async (params: any) => {
  return await request.get({ url: `/trade/brokerage-withdraw/page`, params })
}

// 查询佣金提现详情
export const getBrokerageWithdraw = async (id: number) => {
  return await request.get({ url: `/trade/brokerage-withdraw/get?id=` + id })
}

// 佣金提现 - 通过申请
export const approveBrokerageWithdraw = async (id: number) => {
  return await request.put({ url: `/trade/brokerage-withdraw/approve?id=` + id })
}

// 审核佣金提现 - 驳回申请
export const rejectBrokerageWithdraw = async (data: BrokerageWithdrawVO) => {
  return await request.put({ url: `/trade/brokerage-withdraw/reject`, data })
}
