import request from '@/config/axios'

export interface StatisticsCustomerRespVO {
  count: number
  cycle: number
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
  // 获取客户跟进次数
  getRecordCount: (params: any) => {
    return request.get({
      url: '/crm/statistics-customer/get-record-count',
      params
    })
  },
  // 获取客户跟进次数
  getDistinctRecordCount: (params: any) => {
    return request.get({
      url: '/crm/statistics-customer/get-distinct-record-count',
      params
    })
  },
  // 获取客户跟进方式统计数
  getRecordTypeCount: (params: any) => {
    return request.get({
      url: '/crm/statistics-customer/get-record-type-count',
      params
    })
  },
  // 获取客户成交周期
  getCustomerCycle: (params: any) => {
    return request.get({
      url: '/crm/statistics-customer/get-customer-cycle',
      params
    })
  },
}
