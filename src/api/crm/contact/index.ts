import request from '@/config/axios'

export interface ContactVO {
  name: string
  nextTime: Date
  mobile: string
  telephone: string
  email: string
  post: string
  customerId: number
  address: string
  remark: string
  ownerUserId: string
  lastTime: Date
  id: number
  parentId: number
  qq: number
  wechat: string
  sex: number
  master: boolean
  creatorName: string
  updateTime?: Date
  createTime?: Date
  customerName: string
  areaName: string
  ownerUserName: string
}

// 查询 CRM 联系人列表
export const getContactPage = async (params) => {
  return await request.get({ url: `/crm/contact/page`, params })
}

// 查询 CRM 联系人列表，基于指定客户
export const getContactPageByCustomer = async (params: any) => {
  return await request.get({ url: `/crm/contact/page-by-customer`, params })
}

// 查询 CRM 联系人详情
export const getContact = async (id: number) => {
  return await request.get({ url: `/crm/contact/get?id=` + id })
}

// 新增 CRM 联系人
export const createContact = async (data: ContactVO) => {
  return await request.post({ url: `/crm/contact/create`, data })
}

// 修改 CRM 联系人
export const updateContact = async (data: ContactVO) => {
  return await request.put({ url: `/crm/contact/update`, data })
}

// 删除 CRM 联系人
export const deleteContact = async (id: number) => {
  return await request.delete({ url: `/crm/contact/delete?id=` + id })
}

// 导出 CRM 联系人 Excel
export const exportContact = async (params) => {
  return await request.download({ url: `/crm/contact/export-excel`, params })
}

// 获得 CRM 联系人列表（精简）
export const getSimpleContactList = async () => {
  return await request.get({ url: `/crm/contact/simple-all-list` })
}
