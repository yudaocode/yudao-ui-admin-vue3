import request from '@/config/axios'

export interface BiRankRespVO {
  count: number
  nickname: string
  deptName: string
}

// 排行 API
export const RankApi = {
  // 获得合同排行榜
  getContractPriceRank: (params: any) => {
    return request.get({
      url: '/crm/bi-rank/get-contract-price-rank',
      params
    })
  },
  // 获得回款排行榜
  getReceivablePriceRank: (params: any) => {
    return request.get({
      url: '/crm/bi-rank/get-receivable-price-rank',
      params
    })
  }
}
