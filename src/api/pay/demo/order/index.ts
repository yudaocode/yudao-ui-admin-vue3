import request from '@/config/axios'

export interface DemoOrderVO {
  spuId: number
  createTime: Date
}

// 创建示例订单
export function createDemoOrder(data: DemoOrderVO) {
  return request.post({
    url: '/pay/demo-order/create',
    data: data
  })
}

// 获得示例订单分页
export function getDemoOrderPage(query: PageParam) {
  return request.get({
    url: '/pay/demo-order/page',
    params: query
  })
}

// 退款示例订单
export function refundDemoOrder(id: number) {
  return request.put({
    url: '/pay/demo-order/refund?id=' + id
  })
}
