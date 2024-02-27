import request from '@/config/axios'

export interface StatisticsCustomerRespVO {
  count: number
  category: string
}

// 客户总量分析 API
export const StatisticsCustomerApi = {
  // 客户总量(新建)
  getTotalCustomerCount: (params: any) => {
    return request.get({
      url: '/crm/statistics-customer/get-total-customer-count',
      params
    })
  },
  // 客户总量(成交)
  getDealTotalCustomerCount: (params: any) => {
    return request.get({
      url: '/crm/statistics-customer/get-deal-total-customer-count',
      params
    })
  },
}
