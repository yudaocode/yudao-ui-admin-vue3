import request from '@/config/axios'

export interface CrmStatisticFunnelRespVO {
  customerCount: number // 客户数
  businessCount: number // 商机数
  businessWinCount: number // 赢单数
}

export interface CrmStatisticsBusinessSummaryByDateRespVO {
  time: string // 时间
  businessCreateCount: number // 商机数
  totalPrice: number | string // 商机金额
}

export interface CrmStatisticsBusinessInversionRateSummaryByDateRespVO {
  time: string // 时间
  businessCount: number // 商机数量
  businessWinCount: number // 赢单商机数
}

// 客户分析 API
export const StatisticFunnelApi = {
  // 1. 获取销售漏斗统计数据
  getFunnelSummary: (params: any) => {
    return request.get({
      url: '/crm/statistics-funnel/get-funnel-summary',
      params
    })
  },
  // 2. 获取商机结束状态统计
  getBusinessSummaryByEndStatus: (params: any) => {
    return request.get({
      url: '/crm/statistics-funnel/get-business-summary-by-end-status',
      params
    })
  },
  // 3. 获取新增商机分析(按日期)
  getBusinessSummaryByDate: (params: any) => {
    return request.get({
      url: '/crm/statistics-funnel/get-business-summary-by-date',
      params
    })
  },
  // 4. 获取商机转化率分析(按日期)
  getBusinessInversionRateSummaryByDate: (params: any) => {
    return request.get({
      url: '/crm/statistics-funnel/get-business-inversion-rate-summary-by-date',
      params
    })
  },
  // 5. 获取商机列表(按日期)
  getBusinessPageByDate: (params: any) => {
    return request.get({
      url: '/crm/statistics-funnel/get-business-page-by-date',
      params
    })
  }
}
