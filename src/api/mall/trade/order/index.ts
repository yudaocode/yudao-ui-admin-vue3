import request from '@/config/axios'

// 获得交易订单分页
export const getOrderList = (params: PageParam) => {
  return request.get({ url: '/trade/order/page', params })
}

// 获得交易订单详情
export const getOrderDetail = (id: number) => {
  return request.get({ url: '/trade/order/get-detail?id=' + id })
}
