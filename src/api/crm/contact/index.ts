import request from '@/config/axios'
import { TransferReqVO } from '@/api/crm/customer'

export interface ContactVO {
  name: string
  nextTime: Date
  mobile: string
  telephone: string
  email: string
  post: string
  customerId: number
  detailAddress: string
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

export interface ContactBusinessReqVO {
  contactId: number
  businessIds: number[]
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

// 获得 CRM 联系人列表
export const getContactListByIds = async (val: number[]) => {
  return await request.get({ url: '/crm/contact/list-by-ids', params: { ids: val.join(',') } })
}

// 批量新增联系人商机关联
export const createContactBusinessList = async (data: ContactBusinessReqVO) => {
  return await request.post({ url: `/crm/contact/create-business-list`, data })
}

// 解除联系人商机关联
export const deleteContactBusinessList = async (data: ContactBusinessReqVO) => {
  return await request.delete({ url: `/crm/contact/delete-business-list`, data })
}

// 联系人转移
export const transferContact = async (data: TransferReqVO) => {
  return await request.put({ url: '/crm/contact/transfer', data })
}
