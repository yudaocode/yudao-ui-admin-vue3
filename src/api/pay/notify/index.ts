import request from '@/config/axios'

// 获得支付通知明细
export const getNotifyTaskDetail = (id) => {
  return request.get({
    url: '/pay/notify/get-detail?id=' + id
  })
}

// 获得支付通知分页
export const getNotifyTaskPage = (query) => {
  return request.get({
    url: '/pay/notify/page',
    params: query
  })
}
