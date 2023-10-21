import request from '@/config/axios'

export interface ReceivableVO {
  id: number
  no: string
  planId: number
  customerId: number
  contractId: number
  checkStatus: number
  processInstanceId: number
  returnTime: Date
  returnType: string
  price: number
  ownerUserId: number
  batchId: number
  sort: number
  dataScope: number
  dataScopeDeptIds: string
  status: number
  remark: string
}

// 查询回款管理列表
export const getReceivablePage = async (params) => {
  return await request.get({ url: `/crm/receivable/page`, params })
}

// 查询回款管理详情
export const getReceivable = async (id: number) => {
  return await request.get({ url: `/crm/receivable/get?id=` + id })
}

// 新增回款管理
export const createReceivable = async (data: ReceivableVO) => {
  return await request.post({ url: `/crm/receivable/create`, data })
}

// 修改回款管理
export const updateReceivable = async (data: ReceivableVO) => {
  return await request.put({ url: `/crm/receivable/update`, data })
}

// 删除回款管理
export const deleteReceivable = async (id: number) => {
  return await request.delete({ url: `/crm/receivable/delete?id=` + id })
}

// 导出回款管理 Excel
export const exportReceivable = async (params) => {
  return await request.download({ url: `/crm/receivable/export-excel`, params })
}
