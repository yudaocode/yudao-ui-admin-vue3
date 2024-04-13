import request from '@/config/axios'

export interface CrmStatisticFunnelRespVO {
  customerCount: number // 客户数
  businessCount: number // 商机数
  winCount: number // 赢单数
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
  getBusinessEndStatusSummary: (params: any) => {
    return request.get({
      url: '/crm/statistics-funnel/get-business-end-status-summary',
      params
    })
  }
}
