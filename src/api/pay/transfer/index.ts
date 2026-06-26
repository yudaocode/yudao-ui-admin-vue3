import request from '@/config/axios'

export interface TransferVO {
  id?: number
  no?: string
  appId?: number
  appName?: string
  channelId?: number
  channelCode?: string
  merchantTransferId?: string
  type?: string
  status?: number
  successTime?: Date
  price?: number
  subject?: string
  userName?: string
  userAccount?: string
  accountNo?: string
  channelTransferNo?: string
  userIp?: string
  notifyUrl?: string
  channelNotifyData?: string
  createTime?: Date
}

// 查询转账单列表
export const getTransferPage = async (params: any) => {
  return await request.get<PageResult<TransferVO[]>>({
    url: `/pay/transfer/page`,
    params
  })
}

// 查询转账单详情
export const getTransfer = async (id: number) => {
  return await request.get<TransferVO>({ url: '/pay/transfer/get?id=' + id })
}

// 导出转账单
export const exportTransfer = async (params: any) => {
  return await request.download({ url: '/pay/transfer/export-excel', params })
}
