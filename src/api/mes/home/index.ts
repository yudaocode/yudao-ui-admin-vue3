import request from '@/config/axios'

// MES 首页汇总统计 VO
export interface MesHomeSummaryVO {
  workOrderActiveCount: number
  workOrderPrepareCount: number
  workOrderFinishedCount: number
  todayOutput: number
  yesterdayOutput: number
  todayQualifiedQuantity: number
  todayUnqualifiedQuantity: number
  machineryTotal: number
  machineryProducing: number
  machineryStop: number
  machineryMaintenance: number
  andonActiveCount: number
  repairActiveCount: number
}

// MES 工单状态分布 VO
export interface MesHomeWorkOrderStatusVO {
  status: number
  statusName: string
  count: number
}

// MES 生产趋势 VO
export interface MesHomeProductionTrendVO {
  date: string
  quantity: number
  qualifiedQuantity: number
  unqualifiedQuantity: number
}

// MES 首页统计 API
export const MesHomeStatisticsApi = {
  // 获得首页汇总统计
  getHomeSummary: async (): Promise<MesHomeSummaryVO> => {
    return await request.get({ url: `/mes/home-statistics/summary` })
  },

  // 获得工单状态分布
  getWorkOrderStatusDistribution: async (): Promise<MesHomeWorkOrderStatusVO[]> => {
    return await request.get({ url: `/mes/home-statistics/work-order-status` })
  },

  // 获得生产趋势
  getProductionTrend: async (days?: number): Promise<MesHomeProductionTrendVO[]> => {
    return await request.get({ url: `/mes/home-statistics/production-trend`, params: { days } })
  }
}
