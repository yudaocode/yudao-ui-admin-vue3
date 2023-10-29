import request from '@/config/axios'

export interface TransferVO {
  appId: number
  channelCode: string
  merchantTransferId: string
  type: number
  price: number
  subject: string
  userName: string
  alipayLogonId: string
  openid: string
}

// 新增转账单
export const createTransfer = async (data: TransferVO) => {
  return await request.post({ url: `/pay/transfer/create`, data })
}
