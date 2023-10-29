import request from '@/config/axios'

export interface DemoTransferVO {
  price: number
  type: number
  userName: string
  alipayLogonId: string
  openid: string
}

// 创建示例转账单
export function createDemoTransfer(data: DemoTransferVO) {
  return request.post({
    url: '/pay/demo-transfer/create',
    data: data
  })
}

// 获得示例订单分页
export function getDemoTransferPage(query: PageParam) {
  return request.get({
    url: '/pay/demo-transfer/page',
    params: query
  })
}
