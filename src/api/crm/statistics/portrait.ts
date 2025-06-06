import request from '@/config/axios'

export interface CrmStatisticCustomerBaseRespVO {
  customerCount: number
  dealCount: number
  dealPortion: string | number
}

export interface CrmStatisticCustomerIndustryRespVO extends CrmStatisticCustomerBaseRespVO {
  industryId: number
  industryPortion: string | number
}

export interface CrmStatisticCustomerSourceRespVO extends CrmStatisticCustomerBaseRespVO {
  source: number
  sourcePortion: string | number
}

export interface CrmStatisticCustomerLevelRespVO extends CrmStatisticCustomerBaseRespVO {
  level: number
  levelPortion: string | number
}

export interface CrmStatisticCustomerAreaRespVO extends CrmStatisticCustomerBaseRespVO {
  areaId: number
  areaName: string
  areaPortion: string | number
}

// 客户分析 API
export const StatisticsPortraitApi = {
  // 1. 获取客户行业统计数据
  getCustomerIndustry: (params: any) => {
    return request.get({
      url: '/crm/statistics-portrait/get-customer-industry-summary',
      params
    })
  },
  // 2. 获取客户来源统计数据
  getCustomerSource: (params: any) => {
    return request.get({
      url: '/crm/statistics-portrait/get-customer-source-summary',
      params
    })
  },
  // 3. 获取客户级别统计数据
  getCustomerLevel: (params: any) => {
    return request.get({
      url: '/crm/statistics-portrait/get-customer-level-summary',
      params
    })
  },
  // 4. 获取客户地区统计数据
  getCustomerArea: (params: any) => {
    return request.get({
      url: '/crm/statistics-portrait/get-customer-area-summary',
      params
    })
  }
}
