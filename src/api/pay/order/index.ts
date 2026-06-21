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
  price: number
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

export interface OrderDetailVO {
  merchantOrderId?: string
  no?: string
  appId?: number
  appName?: string
  status?: number
  price?: number
  refundPrice?: number
  channelFeePrice?: number
  channelFeeRate?: number
  successTime?: Date
  expireTime?: Date
  createTime?: Date
  updateTime?: Date
  subject?: string
  body?: string
  channelCode?: string
  userIp?: string
  channelOrderNo?: string
  channelUserId?: string
  notifyUrl?: string
  extension?: {
    channelNotifyData?: string
  }
}

// 查询列表支付订单
export const getOrderPage = async (params: any) => {
  return await request.get<PageResult<OrderDetailVO[]>>({
    url: '/pay/order/page',
    params
  })
}

// 查询详情支付订单
export const getOrder = async (id: number, sync?: boolean) => {
  return await request.get<OrderVO>({
    url: '/pay/order/get',
    params: {
      id,
      sync
    }
  })
}

// 获得支付订单的明细
export const getOrderDetail = async (id: number) => {
  return await request.get<OrderDetailVO>({ url: '/pay/order/get-detail?id=' + id })
}

// 提交支付订单
export const submitOrder = async (data: any) => {
  return await request.post({ url: '/pay/order/submit', data })
}

// 导出支付订单
export const exportOrder = async (params: any) => {
  return await request.download({ url: '/pay/order/export-excel', params })
}
