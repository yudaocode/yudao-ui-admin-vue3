import request from '@/config/axios'
import { TransferReqVO } from '@/api/crm/permission'

export interface ContactVO {
  id: number // 编号
  name: string // 联系人名称
  customerId: number // 客户编号
  customerName?: string // 客户名称
  contactLastTime: Date // 最后跟进时间
  contactLastContent: string // 最后跟进内容
  contactNextTime: Date // 下次联系时间
  ownerUserId: number // 负责人的用户编号
  ownerUserName?: string // 负责人的用户名称
  ownerUserDept?: string // 负责人的部门名称
  mobile: string // 手机号
  telephone: string // 电话
  qq: string // QQ
  wechat: string // wechat
  email: string // email
  areaId: number // 所在地
  areaName?: string // 所在地名称
  detailAddress: string // 详细地址
  sex: number // 性别
  master: boolean // 是否主联系人
  post: string // 职务
  parentId: number // 上级联系人编号
  parentName?: string // 上级联系人名称
  remark: string // 备注
  creator: string // 创建人
  creatorName?: string // 创建人名称
  createTime: Date // 创建时间
  updateTime: Date // 更新时间
}

export interface ContactBusinessReqVO {
  contactId: number
  businessIds: number[]
}

export interface ContactBusiness2ReqVO {
  businessId: number
  contactIds: number[]
}

// 查询 CRM 联系人列表
export const getContactPage = async (params) => {
  return await request.get({ url: `/crm/contact/page`, params })
}

// 查询 CRM 联系人列表，基于指定客户
export const getContactPageByCustomer = async (params: any) => {
  return await request.get({ url: `/crm/contact/page-by-customer`, params })
}

// 查询 CRM 联系人列表，基于指定商机
export const getContactPageByBusiness = async (params: any) => {
  return await request.get({ url: `/crm/contact/page-by-business`, params })
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

// 批量新增联系人商机关联
export const createContactBusinessList = async (data: ContactBusinessReqVO) => {
  return await request.post({ url: `/crm/contact/create-business-list`, data })
}

// 批量新增联系人商机关联
export const createContactBusinessList2 = async (data: ContactBusiness2ReqVO) => {
  return await request.post({ url: `/crm/contact/create-business-list2`, data })
}

// 解除联系人商机关联
export const deleteContactBusinessList = async (data: ContactBusinessReqVO) => {
  return await request.delete({ url: `/crm/contact/delete-business-list`, data })
}

// 解除联系人商机关联
export const deleteContactBusinessList2 = async (data: ContactBusiness2ReqVO) => {
  return await request.delete({ url: `/crm/contact/delete-business-list2`, data })
}

// 联系人转移
export const transferContact = async (data: TransferReqVO) => {
  return await request.put({ url: '/crm/contact/transfer', data })
}
