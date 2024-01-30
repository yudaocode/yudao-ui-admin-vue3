import request from '@/config/axios'

export interface BiContractRanKingRespVO {
  price: number
  nickname: string
  deptName: string
}
export interface BiReceivablesRanKingRespVO {
  price: number
  nickname: string
  deptName: string
}
export interface BiRankReqVO {
  deptId: number
  type: string
}

// 排行 API
export const RankingStatisticsApi = {
  // 获得合同排行榜
  contractAmountRanking: (params: any) => {
    return request.get({
      url: '/bi/ranking/contract-ranking',
      params
    })
  },
  // 获得回款排行榜
  receivablesAmountRanking: (params: any) => {
    return request.get({
      url: '/bi/ranking/receivables-ranking',
      params
    })
  }
}
