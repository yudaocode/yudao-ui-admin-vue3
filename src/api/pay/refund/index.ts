import request from '@/config/axios'

export interface RefundVO {
  id: number
  merchantId: number
  appId: number
  channelId: number
  channelCode: string
  orderId: string
  tradeNo: string
  merchantOrderId: string
  merchantRefundNo: string
  notifyUrl: string
  notifyStatus: number
  status: number
  type: number
  payAmount: number
  refundAmount: number
  reason: string
  userIp: string
  channelOrderNo: string
  channelRefundNo: string
  channelErrorCode: string
  channelErrorMsg: string
  channelExtras: string
  expireTime: Date
  successTime: Date
  notifyTime: Date
  createTime: Date
}

export interface RefundDetailVO {
  merchantRefundId?: string
  channelRefundNo?: string
  merchantOrderId?: string
  channelOrderNo?: string
  appId?: number
  appName?: string
  payPrice?: number
  refundPrice?: number
  status?: number
  successTime?: Date
  createTime?: Date
  updateTime?: Date
  channelCode?: string
  reason?: string
  userIp?: string
  notifyUrl?: string
  channelErrorCode?: string
  channelErrorMsg?: string
  channelNotifyData?: string
}

// 查询列表退款订单
export const getRefundPage = (params: any) => {
  return request.get<PageResult<RefundDetailVO[]>>({ url: '/pay/refund/page', params })
}

// 查询详情退款订单
export const getRefund = (id: number) => {
  return request.get<RefundDetailVO>({ url: '/pay/refund/get?id=' + id })
}

// 新增退款订单
export const createRefund = (data: RefundVO) => {
  return request.post({ url: '/pay/refund/create', data })
}

// 修改退款订单
export const updateRefund = (data: RefundVO) => {
  return request.put({ url: '/pay/refund/update', data })
}

// 删除退款订单
export const deleteRefund = (id: number) => {
  return request.delete({ url: '/pay/refund/delete?id=' + id })
}

// 导出退款订单
export const exportRefund = (params: any) => {
  return request.download({ url: '/pay/refund/export-excel', params })
}
