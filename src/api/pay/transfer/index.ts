import request from '@/config/axios'

// TODO @芋艿：调整字段
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

// 查询转账单列表
export const getTransferPage = async (params: PageParam) => {
  return await request.get({ url: `/pay/transfer/page`, params })
}

export const getTransfer = async (id: number) => {
  return await request.get({ url: '/pay/transfer/get?id=' + id })
}
