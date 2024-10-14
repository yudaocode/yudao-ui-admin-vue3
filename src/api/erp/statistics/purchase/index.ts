import request from '@/config/axios'

// ERP 采购全局统计 VO
export interface ErpPurchaseSummaryRespVO {
  todayPrice: number // 今日采购金额
  yesterdayPrice: number // 昨日采购金额
  monthPrice: number // 本月采购金额
  yearPrice: number // 今年采购金额
}

// ERP 采购时间段统计 VO
export interface ErpPurchaseTimeSummaryRespVO {
  time: string // 时间
  price: number // 采购金额
}

// ERP 采购统计 API
export const PurchaseStatisticsApi = {
  // 获得采购统计
  getPurchaseSummary: async (): Promise<ErpPurchaseSummaryRespVO> => {
    return await request.get({ url: `/erp/purchase-statistics/summary` })
  },

  // 获得采购时间段统计
  getPurchaseTimeSummary: async (): Promise<ErpPurchaseTimeSummaryRespVO[]> => {
    return await request.get({ url: `/erp/purchase-statistics/time-summary` })
  }
}
