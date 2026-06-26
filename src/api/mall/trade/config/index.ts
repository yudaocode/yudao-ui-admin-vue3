import request from '@/config/axios'

export interface ConfigVO {
  id?: number | null
  afterSaleRefundReasons: string[]
  afterSaleReturnReasons: string[]
  deliveryExpressFreeEnabled: boolean
  deliveryExpressFreePrice: number
  deliveryPickUpEnabled: boolean
  brokerageEnabled: boolean
  brokerageEnabledCondition?: number
  brokerageBindMode?: number
  brokeragePosterUrls: string[]
  brokerageFirstPercent: number
  brokerageSecondPercent: number
  brokerageWithdrawMinPrice: number
  brokerageWithdrawFeePercent: number
  brokerageFrozenDays: number
  brokerageWithdrawTypes: number[]
  tencentLbsKey?: string
}

// 查询交易中心配置详情
export const getTradeConfig = async () => {
  return await request.get<ConfigVO>({ url: `/trade/config/get` })
}

// 保存交易中心配置
export const saveTradeConfig = async (data: ConfigVO) => {
  return await request.put({ url: `/trade/config/save`, data })
}
