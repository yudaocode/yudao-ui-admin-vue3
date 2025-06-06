import request from '@/config/axios'
import { TransferReqVO } from '@/api/crm/permission'

export interface CustomerVO {
  id: number // 编号
  name: string // 客户名称
  followUpStatus: boolean // 跟进状态
  contactLastTime: Date // 最后跟进时间
  contactLastContent: string // 最后跟进内容
  contactNextTime: Date // 下次联系时间
  ownerUserId: number // 负责人的用户编号
  ownerUserName?: string // 负责人的用户名称
  ownerUserDept?: string // 负责人的部门名称
  lockStatus?: boolean
  dealStatus?: boolean
  mobile: string // 手机号
  telephone: string // 电话
  qq: string // QQ
  wechat: string // wechat
  email: string // email
  areaId: number // 所在地
  areaName?: string // 所在地名称
  detailAddress: string // 详细地址
  industryId: number // 所属行业
  level: number // 客户等级
  source: number // 客户来源
  remark: string // 备注
  creator: string // 创建人
  creatorName?: string // 创建人名称
  createTime: Date // 创建时间
  updateTime: Date // 更新时间
}

// 查询客户列表
export const getCustomerPage = async (params) => {
  return await request.get({ url: `/crm/customer/page`, params })
}

// 进入公海客户提醒的客户列表
export const getPutPoolRemindCustomerPage = async (params) => {
  return await request.get({ url: `/crm/customer/put-pool-remind-page`, params })
}

// 获得待进入公海客户数量
export const getPutPoolRemindCustomerCount = async () => {
  return await request.get({ url: `/crm/customer/put-pool-remind-count` })
}

// 获得今日需联系客户数量
export const getTodayContactCustomerCount = async () => {
  return await request.get({ url: `/crm/customer/today-contact-count` })
}

// 获得分配给我、待跟进的线索数量的客户数量
export const getFollowCustomerCount = async () => {
  return await request.get({ url: `/crm/customer/follow-count` })
}

// 查询客户详情
export const getCustomer = async (id: number) => {
  return await request.get({ url: `/crm/customer/get?id=` + id })
}

// 新增客户
export const createCustomer = async (data: CustomerVO) => {
  return await request.post({ url: `/crm/customer/create`, data })
}

// 修改客户
export const updateCustomer = async (data: CustomerVO) => {
  return await request.put({ url: `/crm/customer/update`, data })
}

// 更新客户的成交状态
export const updateCustomerDealStatus = async (id: number, dealStatus: boolean) => {
  return await request.put({ url: `/crm/customer/update-deal-status`, params: { id, dealStatus } })
}

// 删除客户
export const deleteCustomer = async (id: number) => {
  return await request.delete({ url: `/crm/customer/delete?id=` + id })
}

// 导出客户 Excel
export const exportCustomer = async (params: any) => {
  return await request.download({ url: `/crm/customer/export-excel`, params })
}

// 下载客户导入模板
export const importCustomerTemplate = () => {
  return request.download({ url: '/crm/customer/get-import-template' })
}

// 导入客户
export const handleImport = async (formData) => {
  return await request.upload({ url: `/crm/customer/import`, data: formData })
}

// 客户列表
export const getCustomerSimpleList = async () => {
  return await request.get({ url: `/crm/customer/simple-list` })
}

// ======================= 业务操作 =======================

// 客户转移
export const transferCustomer = async (data: TransferReqVO) => {
  return await request.put({ url: '/crm/customer/transfer', data })
}

// 锁定/解锁客户
export const lockCustomer = async (id: number, lockStatus: boolean) => {
  return await request.put({ url: `/crm/customer/lock`, data: { id, lockStatus } })
}

// 领取公海客户
export const receiveCustomer = async (ids: any[]) => {
  return await request.put({ url: '/crm/customer/receive', params: { ids: ids.join(',') } })
}

// 分配公海给对应负责人
export const distributeCustomer = async (ids: any[], ownerUserId: number) => {
  return await request.put({
    url: '/crm/customer/distribute',
    data: { ids: ids, ownerUserId }
  })
}

// 客户放入公海
export const putCustomerPool = async (id: number) => {
  return await request.put({ url: `/crm/customer/put-pool?id=${id}` })
}
