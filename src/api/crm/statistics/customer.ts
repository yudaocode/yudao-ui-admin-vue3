import request from '@/config/axios'

export interface CrmStatisticsCustomerSummaryByDateRespVO {
  time: string
  customerCreateCount: number
  customerDealCount: number
}

export interface CrmStatisticsCustomerSummaryByUserRespVO {
  ownerUserName: string
  customerCreateCount: number
  customerDealCount: number
  contractPrice: number
  receivablePrice: number
}

export interface CrmStatisticsFollowUpSummaryByDateRespVO {
  time: string
  followUpRecordCount: number
  followUpCustomerCount: number
}

export interface CrmStatisticsFollowUpSummaryByUserRespVO {
  ownerUserName: string
  followupRecordCount: number
  followupCustomerCount: number
}

export interface CrmStatisticsFollowUpSummaryByTypeRespVO {
  followUpType: string
  followUpRecordCount: number
}

export interface CrmStatisticsCustomerContractSummaryRespVO {
  customerName: string
  contractName: string
  totalPrice: number
  receivablePrice: number
  customerType: string
  customerSource: string
  ownerUserName: string
  creatorUserName: string
  createTime: Date
  orderDate: Date
}

export interface CrmStatisticsCustomerDealCycleByDateRespVO {
  time: string
  customerDealCycle: number
}

export interface CrmStatisticCustomerBaseRespVO {
  customerCount: number
  dealCount: number
  dealPortion: number
}

export interface CrmStatisticCustomerIndustryRespVO extends CrmStatisticCustomerBaseRespVO {
  industryId: number
  industryName: string
  industryPortion: number
}

export interface CrmStatisticCustomerSourceRespVO extends CrmStatisticCustomerBaseRespVO {
  source: number
  sourceName: string
  sourcePortion: number
}

export interface CrmStatisticCustomerLevelRespVO extends CrmStatisticCustomerBaseRespVO {
  level: number
  levelName: string
  levelPortion: number
}

export interface CrmStatisticCustomerAreaRespVO extends CrmStatisticCustomerBaseRespVO {
  areaId: number
  areaName: string
  areaPortion: number
}

export interface CrmStatisticsCustomerDealCycleByUserRespVO {
  ownerUserName: string
  customerDealCycle: number
  customerDealCount: number
}

// 客户分析 API
export const StatisticsCustomerApi = {
  // 1.1 客户总量分析(按日期)
  getCustomerSummaryByDate: (params: any) => {
    return request.get({
      url: '/crm/statistics-customer/get-customer-summary-by-date',
      params
    })
  },
  // 1.2 客户总量分析(按用户)
  getCustomerSummaryByUser: (params: any) => {
    return request.get({
      url: '/crm/statistics-customer/get-customer-summary-by-user',
      params
    })
  },
  // 2.1 客户跟进次数分析(按日期)
  getFollowUpSummaryByDate: (params: any) => {
    return request.get({
      url: '/crm/statistics-customer/get-follow-up-summary-by-date',
      params
    })
  },
  // 2.2 客户跟进次数分析(按用户)
  getFollowUpSummaryByUser: (params: any) => {
    return request.get({
      url: '/crm/statistics-customer/get-follow-up-summary-by-user',
      params
    })
  },
  // 3.1 获取客户跟进方式统计数
  getFollowUpSummaryByType: (params: any) => {
    return request.get({
      url: '/crm/statistics-customer/get-follow-up-summary-by-type',
      params
    })
  },
  // 4.1 合同摘要信息(客户转化率页面)
  getContractSummary: (params: any) => {
    return request.get({
      url: '/crm/statistics-customer/get-contract-summary',
      params
    })
  },
  // 5.1 获取客户成交周期(按日期)
  getCustomerDealCycleByDate: (params: any) => {
    return request.get({
      url: '/crm/statistics-customer/get-customer-deal-cycle-by-date',
      params
    })
  },
  // 5.2 获取客户成交周期(按用户)
  getCustomerDealCycleByUser: (params: any) => {
    return request.get({
      url: '/crm/statistics-customer/get-customer-deal-cycle-by-user',
      params
    })
  },
  // TODO @puhui999：下面这些拆出去哈；
  // 6.1 获取客户行业统计数据
  getCustomerIndustry: (params: any) => {
    return request.get({
      url: '/crm/statistics-portrait/get-customer-industry-summary',
      params
    })
  },
  // 6.1 获取客户来源统计数据
  getCustomerSource: (params: any) => {
    return request.get({
      url: '/crm/statistics-portrait/get-customer-source-summary',
      params
    })
  },
  // 6.1 获取客户行业统计数据
  getCustomerLevel: (params: any) => {
    return request.get({
      url: '/crm/statistics-portrait/get-customer-level-summary',
      params
    })
  },
  // 6.1 获取客户行业统计数据
  getCustomerArea: (params: any) => {
    return request.get({
      url: '/crm/statistics-portrait/get-customer-area-summary',
      params
    })
  }
}
