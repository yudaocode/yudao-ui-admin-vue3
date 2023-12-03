import { getBusiness } from './../business/index';
import request from '@/config/axios'

export interface ContactBusinessLinkVO {
  id: number
  contactId: number
  businessId: number
}

// 查询联系人商机关联分页
export const getContactBusinessLinkPage = async (params) => {
  return await request.get({ url: `/crm/contact-business-link/page`, params })
}

// 查询联系人商机关联详情
export const getContactBusinessLink = async (id: number) => {
  return await request.get({ url: `/crm/contact-business-link/get?id=` + id })
}

// 新增联系人商机关联
export const createContactBusinessLink = async (data: ContactBusinessLinkVO) => {
  return await request.post({ url: `/crm/contact-business-link/create`, data })
}

// 修改联系人商机关联
export const updateContactBusinessLink = async (data: ContactBusinessLinkVO) => {
  return await request.put({ url: `/crm/contact-business-link/update`, data })
}

// 删除联系人商机关联
export const deleteContactBusinessLink = async (data: ContactBusinessLinkVO) => {
  return await request.delete({ url: `/crm/contact-business-link/delete-batch` , data })
}

// 导出联系人商机关联 Excel
export const exportContactBusinessLink = async (params) => {
  return await request.download({ url: `/crm/contact-business-link/export-excel`, params })
}

//批量新增联系人商机关联
export const createContactBusinessLinkBatch = async (data: ContactBusinessLinkVO[]) => {
  return await request.post({ url: `/crm/contact-business-link/create-batch`, data })
}
// 查询联系人关联商机列表
export const getBusinessByContactPage = async (params) => {
  return await request.get({ url: `/crm/contact-business-link/page-by-contact` , params })
}