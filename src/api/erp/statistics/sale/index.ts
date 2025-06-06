import request from '@/config/axios'

// ERP 销售全局统计 VO
export interface ErpSaleSummaryRespVO {
  todayPrice: number // 今日销售金额
  yesterdayPrice: number // 昨日销售金额
  monthPrice: number // 本月销售金额
  yearPrice: number // 今年销售金额
}

// ERP 销售时间段统计 VO
export interface ErpSaleTimeSummaryRespVO {
  time: string // 时间
  price: number // 销售金额
}

// ERP 销售统计 API
export const SaleStatisticsApi = {
  // 获得销售统计
  getSaleSummary: async (): Promise<ErpSaleSummaryRespVO> => {
    return await request.get({ url: `/erp/sale-statistics/summary` })
  },

  // 获得销售时间段统计
  getSaleTimeSummary: async (): Promise<ErpSaleTimeSummaryRespVO[]> => {
    return await request.get({ url: `/erp/sale-statistics/time-summary` })
  }
}
