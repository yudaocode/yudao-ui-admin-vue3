import request from '@/config/axios'

export interface StatisticsRankRespVO {
  count: number
  nickname: string
  deptName: string
}

// 排行 API
export const StatisticsRankApi = {
  // 获得合同排行榜
  getContractPriceRank: (params: any) => {
    return request.get({
      url: '/crm/statistics-rank/get-contract-price-rank',
      params
    })
  },
  // 获得回款排行榜
  getReceivablePriceRank: (params: any) => {
    return request.get({
      url: '/crm/statistics-rank/get-receivable-price-rank',
      params
    })
  },
  // 签约合同排行
  getContractCountRank: (params: any) => {
    return request.get({
      url: '/crm/statistics-rank/get-contract-count-rank',
      params
    })
  },
  // 产品销量排行
  getProductSalesRank: (params: any) => {
    return request.get({
      url: '/crm/statistics-rank/get-product-sales-rank',
      params
    })
  },
  // 新增客户数排行
  getCustomerCountRank: (params: any) => {
    return request.get({
      url: '/crm/statistics-rank/get-customer-count-rank',
      params
    })
  },
  // 新增联系人数排行
  getContactsCountRank: (params: any) => {
    return request.get({
      url: '/crm/statistics-rank/get-contacts-count-rank',
      params
    })
  },
  // 跟进次数排行
  getFollowCountRank: (params: any) => {
    return request.get({
      url: '/crm/statistics-rank/get-follow-count-rank',
      params
    })
  },
  // 跟进客户数排行
  getFollowCustomerCountRank: (params: any) => {
    return request.get({
      url: '/crm/statistics-rank/get-follow-customer-count-rank',
      params
    })
  }
}
