import request from '@/config/axios'

export interface CustomerVO {
  id?: number
  name: string
  industryId: number
  level: number
  source: number
  followUpStatus?: boolean
  lockStatus?: boolean
  dealStatus?: boolean
  mobile: string
  telephone: string
  website: string
  qq: string
  wechat: string
  email: string
  description: string
  remark: string
  ownerUserId?: number
  ownerUserName?: string
  ownerUserDept?: string
  roUserIds?: string
  rwUserIds?: string
  areaId?: number
  areaName?: string
  detailAddress: string
  contactLastTime?: Date
  contactNextTime: Date
  createTime?: Date
  updateTime?: Date
  creator?: string
  creatorName?: string
}

// 查询客户列表
export const getCustomerPage = async (params) => {
  return await request.get({ url: `/crm/customer/page`, params })
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

// 删除客户
export const deleteCustomer = async (id: number) => {
  return await request.delete({ url: `/crm/customer/delete?id=` + id })
}

// 导出客户 Excel
export const exportCustomer = async (params: any) => {
  return await request.download({ url: `/crm/customer/export-excel`, params })
}

// 客户列表
export const queryAllList = async () => {
  return await request.get({ url: `/crm/customer/query-all-list` })
}

// 查询客户操作日志
export const getOperateLogPage = async (id: number) => {
  return await request.get({ url: '/crm/customer/operate-log-page?id=' + id })
}

//======================= 业务操作 =======================

// 锁定/解锁客户
export const lockCustomer = async (id: number, lockStatus: boolean) => {
  return await request.put({ url: `/crm/customer/lock`, data: { id, lockStatus } })
}

// 领取公海客户
export const receive = async (ids: any[]) => {
  return await request.put({ url: '/crm/customer/receive', params: { ids: ids.join(',') } })
}

// 客户放入公海
export const putPool = async (id: number) => {
  return await request.put({ url: `/crm/customer/put-pool?id=${id}` })
}
