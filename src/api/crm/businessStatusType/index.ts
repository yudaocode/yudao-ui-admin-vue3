import request from '@/config/axios'

export interface BusinessStatusTypeVO {
  id: number
  name: string
  deptIds: number[]
  status: boolean
}

// 查询商机状态类型列表
export const getBusinessStatusTypePage = async (params) => {
  return await request.get({ url: `/crm/business-status-type/page`, params })
}

// 查询商机状态类型详情
export const getBusinessStatusType = async (id: number) => {
  return await request.get({ url: `/crm/business-status-type/get?id=` + id })
}

// 新增商机状态类型
export const createBusinessStatusType = async (data: BusinessStatusTypeVO) => {
  return await request.post({ url: `/crm/business-status-type/create`, data })
}

// 修改商机状态类型
export const updateBusinessStatusType = async (data: BusinessStatusTypeVO) => {
  return await request.put({ url: `/crm/business-status-type/update`, data })
}

// 删除商机状态类型
export const deleteBusinessStatusType = async (id: number) => {
  return await request.delete({ url: `/crm/business-status-type/delete?id=` + id })
}

// 导出商机状态类型 Excel
export const exportBusinessStatusType = async (params) => {
  return await request.download({ url: `/crm/business-status-type/export-excel`, params })
}

// 获取商机状态类型信息列表
export const getBusinessStatusTypeList = async () => {
  return await request.get({ url: `/crm/business-status-type/get-simple-list` })
}

// 根据类型ID获取商机状态信息列表
export const getBusinessStatusListByTypeId = async (typeId: number) => {
  return await request.get({ url: `/crm/business-status-type/get-status-list?typeId=` + typeId })
}
