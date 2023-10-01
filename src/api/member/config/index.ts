import request from '@/config/axios'

export interface ConfigVO {
  id: number
  pointTradeDeductEnable: number
  pointTradeDeductUnitPrice: number
  pointTradeDeductMaxPrice: number
  pointTradeGivePoint: number
}

// 查询积分设置详情
export const getConfig = async () => {
  return await request.get({ url: `/member/config/get` })
}

// 新增修改积分设置
export const saveConfig = async (data: ConfigVO) => {
  return await request.put({ url: `/member/config/save`, data })
}
