import request from '@/config/axios'

export interface ContractVO {
  id: number
  name: string
  customerId: number
  businessId: number
  processInstanceId: number
  orderDate: Date
  ownerUserId: number
  no: string
  startTime: Date
  endTime: Date
  price: number
  discountPercent: number
  productPrice: number
  roUserIds: string
  rwUserIds: string
  contactId: number
  signUserId: number
  contactLastTime: Date
  remark: string
}

// 查询合同列表
export const getContractPage = async (params) => {
  return await request.get({ url: `/crm/contract/page`, params })
}

// 查询合同详情
export const getContract = async (id: number) => {
  return await request.get({ url: `/crm/contract/get?id=` + id })
}

// 新增合同
export const createContract = async (data: ContractVO) => {
  return await request.post({ url: `/crm/contract/create`, data })
}

// 修改合同
export const updateContract = async (data: ContractVO) => {
  return await request.put({ url: `/crm/contract/update`, data })
}

// 删除合同
export const deleteContract = async (id: number) => {
  return await request.delete({ url: `/crm/contract/delete?id=` + id })
}

// 导出合同 Excel
export const exportContract = async (params) => {
  return await request.download({ url: `/crm/contract/export-excel`, params })
}
