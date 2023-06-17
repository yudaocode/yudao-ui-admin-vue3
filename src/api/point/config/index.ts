import request from '@/config/axios'

export interface ConfigVO {
  id: number
  tradeDeductEnable: number
  tradeDeductUnitPrice: number
  tradeDeductMaxPrice: number
  tradeGivePoint: number
}

// 查询积分设置列表
export const getConfigPage = async (params) => {
  return await request.get({ url: `/point/config/page`, params })
}

// 查询积分设置详情
export const getConfig = async (id: number) => {
  return await request.get({ url: `/point/config/get?id=` + id })
}

// 新增积分设置
export const createConfig = async (data: ConfigVO) => {
  return await request.post({ url: `/point/config/create`, data })
}

// 修改积分设置
export const updateConfig = async (data: ConfigVO) => {
  return await request.put({ url: `/point/config/update`, data })
}

// 删除积分设置
export const deleteConfig = async (id: number) => {
  return await request.delete({ url: `/point/config/delete?id=` + id })
}

// 导出积分设置 Excel
export const exportConfig = async (params) => {
  return await request.download({ url: `/point/config/export-excel`, params })
}
