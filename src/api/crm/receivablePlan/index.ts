import request from '@/config/axios'

export interface ReceivablePlanVO {
  id: number
  period: number
  receivableId: number
  status: number
  checkStatus: string
  processInstanceId: number
  price: number
  returnTime: Date
  remindDays: number
  remindTime: Date
  customerId: number
  contractId: number
  ownerUserId: number
  sort: number
  remark: string
}

// 查询回款计划列表
export const getReceivablePlanPage = async (params) => {
  return await request.get({ url: `/crm/receivable-plan/page`, params })
}

// 查询回款计划详情
export const getReceivablePlan = async (id: number) => {
  return await request.get({ url: `/crm/receivable-plan/get?id=` + id })
}

// 新增回款计划
export const createReceivablePlan = async (data: ReceivablePlanVO) => {
  return await request.post({ url: `/crm/receivable-plan/create`, data })
}

// 修改回款计划
export const updateReceivablePlan = async (data: ReceivablePlanVO) => {
  return await request.put({ url: `/crm/receivable-plan/update`, data })
}

// 删除回款计划
export const deleteReceivablePlan = async (id: number) => {
  return await request.delete({ url: `/crm/receivable-plan/delete?id=` + id })
}

// 导出回款计划 Excel
export const exportReceivablePlan = async (params) => {
  return await request.download({ url: `/crm/receivable-plan/export-excel`, params })
}
