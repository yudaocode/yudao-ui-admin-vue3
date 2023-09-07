import request from '@/config/axios'

export interface ConfigVO {
  id: number
  tradeDeductEnable: number
  tradeDeductUnitPrice: number
  tradeDeductMaxPrice: number
  tradeGivePoint: number
  brokerageEnabled: boolean
  brokerageEnabledCondition: number
  brokerageBindMode: number
  brokeragePostUrls: string[]
  brokerageFirstPercent: number
  brokerageSecondPercent: number
  brokerageWithdrawMinPrice: number
  brokerageBankNames: number[]
  brokerageFrozenDays: number
  brokerageWithdrawType: number[]
}

// 查询积分设置详情
export const getConfig = async () => {
  return await request.get({ url: `/member/point/config/get` })
}

// 新增修改积分设置
export const saveConfig = async (data: ConfigVO) => {
  return await request.put({ url: `/member/point/config/save`, data })
}
