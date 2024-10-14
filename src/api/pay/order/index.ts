import request from '@/config/axios'

export interface OrderVO {
  id: number
  merchantId: number
  appId: number
  channelId: number
  channelCode: string
  merchantOrderId: string
  subject: string
  body: string
  notifyUrl: string
  notifyStatus: number
  amount: number
  channelFeeRate: number
  channelFeeAmount: number
  status: number
  userIp: string
  expireTime: Date
  successTime: Date
  notifyTime: Date
  successExtensionId: number
  refundStatus: number
  refundTimes: number
  refundAmount: number
  channelUserId: string
  channelOrderNo: string
  createTime: Date
}

export interface OrderPageReqVO extends PageParam {
  merchantId?: number
  appId?: number
  channelId?: number
  channelCode?: string
  merchantOrderId?: string
  subject?: string
  body?: string
  notifyUrl?: string
  notifyStatus?: number
  amount?: number
  channelFeeRate?: number
  channelFeeAmount?: number
  status?: number
  expireTime?: Date[]
  successTime?: Date[]
  notifyTime?: Date[]
  successExtensionId?: number
  refundStatus?: number
  refundTimes?: number
  channelUserId?: string
  channelOrderNo?: string
  createTime?: Date[]
}

export interface OrderExportReqVO {
  merchantId?: number
  appId?: number
  channelId?: number
  channelCode?: string
  merchantOrderId?: string
  subject?: string
  body?: string
  notifyUrl?: string
  notifyStatus?: number
  amount?: number
  channelFeeRate?: number
  channelFeeAmount?: number
  status?: number
  expireTime?: Date[]
  successTime?: Date[]
  notifyTime?: Date[]
  successExtensionId?: number
  refundStatus?: number
  refundTimes?: number
  channelUserId?: string
  channelOrderNo?: string
  createTime?: Date[]
}

// 查询列表支付订单
export const getOrderPage = async (params: OrderPageReqVO) => {
  return await request.get({ url: '/pay/order/page', params })
}

// 查询详情支付订单
export const getOrder = async (id: number, sync?: boolean) => {
  return await request.get({
    url: '/pay/order/get',
    params: {
      id,
      sync
    }
  })
}

// 获得支付订单的明细
export const getOrderDetail = async (id: number) => {
  return await request.get({ url: '/pay/order/get-detail?id=' + id })
}

// 提交支付订单
export const submitOrder = async (data: any) => {
  return await request.post({ url: '/pay/order/submit', data })
}

// 导出支付订单
export const exportOrder = async (params: OrderExportReqVO) => {
  return await request.download({ url: '/pay/order/export-excel', params })
}
