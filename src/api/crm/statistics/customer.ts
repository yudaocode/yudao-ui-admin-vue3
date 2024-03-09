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

export interface CrmStatisticsFollowupSummaryByDateRespVO {
  time: string
  followupRecordCount: number
  followupCustomerCount: number
}

export interface CrmStatisticsFollowupSummaryByUserRespVO {
  ownerUserName: string
  followupRecordCount: number
  followupCustomerCount: number
}

export interface CrmStatisticsFollowupSummaryByTypeRespVO {
  followupType: string
  followupRecordCount: number
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
  getFollowupSummaryByDate: (params: any) => {
    return request.get({
      url: '/crm/statistics-customer/get-followup-summary-by-date',
      params
    })
  },
  // 2.2 客户跟进次数分析(按用户)
  getFollowupSummaryByUser: (params: any) => {
    return request.get({
      url: '/crm/statistics-customer/get-followup-summary-by-user',
      params
    })
  },
  // 3.1 获取客户跟进方式统计数
  getFollowupSummaryByType: (params: any) => {
    return request.get({
      url: '/crm/statistics-customer/get-followup-summary-by-type',
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
  }
}
