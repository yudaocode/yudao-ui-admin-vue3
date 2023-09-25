import request from '@/config/axios'

export interface ConfigVO {
  brokerageEnabled: boolean
  brokerageEnabledCondition: number
  brokerageBindMode: number
  brokeragePosterUrls: string
  brokerageFirstPercent: number
  brokerageSecondPercent: number
  brokerageWithdrawMinPrice: number
  brokerageBankNames: string
  brokerageFrozenDays: number
  brokerageWithdrawTypes: string
}

// 查询交易中心配置详情
export const getTradeConfig = async () => {
  return await request.get({ url: `/trade/config/get` })
}

// 保存交易中心配置
export const saveTradeConfig = async (data: ConfigVO) => {
  return await request.put({ url: `/trade/config/save`, data })
}
