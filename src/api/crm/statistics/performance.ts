import request from '@/config/axios'

export interface StatisticsPerformanceRespVO {
  time: string
  currentMonthCount: number
  lastMonthCount: number
  lastYearCount: number
}

// 排行 API
export const StatisticsPerformanceApi = {
  // 员工获得合同金额统计
  getContractPricePerformance: (params: any) => {
    return request.get({
      url: '/crm/statistics-performance/get-contract-price-performance',
      params
    })
  },
  // 员工获得回款统计
  getReceivablePricePerformance: (params: any) => {
    return request.get({
      url: '/crm/statistics-performance/get-receivable-price-performance',
      params
    })
  },
  //员工获得签约合同数量统计
  getContractCountPerformance: (params: any) => {
    return request.get({
      url: '/crm/statistics-performance/get-contract-count-performance',
      params
    })
  }
}
