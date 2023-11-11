/*
 * @Author: zyna
 * @Date: 2023-11-05 13:34:41
 * @LastEditTime: 2023-11-11 16:20:19
 * @FilePath: \yudao-ui-admin-vue3\src\api\crm\contact\index.ts
 * @Description:
 */
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
  webchat: string
  sex: number
  policyMakers: boolean
  creatorName: string
  updateTime?: Date
  createTime?: Date
  customerName: string
}

// 查询crm联系人列表
export const getContactPage = async (params) => {
  return await request.get({ url: `/crm/contact/page`, params })
}

// 查询crm联系人详情
export const getContact = async (id: number) => {
  return await request.get({ url: `/crm/contact/get?id=` + id })
}

// 新增crm联系人
export const createContact = async (data: ContactVO) => {
  return await request.post({ url: `/crm/contact/create`, data })
}

// 修改crm联系人
export const updateContact = async (data: ContactVO) => {
  return await request.put({ url: `/crm/contact/update`, data })
}

// 删除crm联系人
export const deleteContact = async (id: number) => {
  return await request.delete({ url: `/crm/contact/delete?id=` + id })
}

// 导出crm联系人 Excel
export const exportContact = async (params) => {
  return await request.download({ url: `/crm/contact/export-excel`, params })
}
export const simpleAlllist = async () => {
  return await request.get({ url: `/crm/contact/simpleAlllist` })
}
