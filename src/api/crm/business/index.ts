import request from '@/config/axios'

export interface BusinessVO {
  id: number
  name: string
  statusTypeId: number
  statusId: number
  contactNextTime: Date
  customerId: number
  dealTime: Date
  price: number
  discountPercent: number
  productPrice: number
  remark: string
  ownerUserId: number
  roUserIds: string
  rwUserIds: string
  endStatus: number
  endRemark: string
  contactLastTime: Date
  followUpStatus: number
}

// 查询 CRM 商机列表
export const getBusinessPage = async (params) => {
  return await request.get({ url: `/crm/business/page`, params })
}

// 查询 CRM 商机列表，基于指定客户
export const getBusinessPageByCustomer = async (params) => {
  return await request.get({ url: `/crm/business/page-by-customer`, params })
}

// 查询 CRM 商机详情
export const getBusiness = async (id: number) => {
  return await request.get({ url: `/crm/business/get?id=` + id })
}

// 新增 CRM 商机
export const createBusiness = async (data: BusinessVO) => {
  return await request.post({ url: `/crm/business/create`, data })
}

// 修改 CRM 商机
export const updateBusiness = async (data: BusinessVO) => {
  return await request.put({ url: `/crm/business/update`, data })
}

// 删除 CRM 商机
export const deleteBusiness = async (id: number) => {
  return await request.delete({ url: `/crm/business/delete?id=` + id })
}

// 导出 CRM 商机 Excel
export const exportBusiness = async (params) => {
  return await request.download({ url: `/crm/business/export-excel`, params })
}
