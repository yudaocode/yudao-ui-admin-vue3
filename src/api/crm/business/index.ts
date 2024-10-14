import request from '@/config/axios'
import { TransferReqVO } from '@/api/crm/permission'

export interface BusinessVO {
  id: number
  name: string
  customerId: number
  customerName?: string
  followUpStatus: boolean
  contactLastTime: Date
  contactNextTime: Date
  ownerUserId: number
  ownerUserName?: string // 负责人的用户名称
  ownerUserDept?: string // 负责人的部门名称
  statusTypeId: number
  statusTypeName?: string
  statusId: number
  statusName?: string
  endStatus: number
  endRemark: string
  dealTime: Date
  totalProductPrice: number
  totalPrice: number
  discountPercent: number
  remark: string
  creator: string // 创建人
  creatorName?: string // 创建人名称
  createTime: Date // 创建时间
  updateTime: Date // 更新时间
  products?: [
    {
      id: number
      productId: number
      productName: string
      productNo: string
      productUnit: number
      productPrice: number
      businessPrice: number
      count: number
      totalPrice: number
    }
  ]
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

// 获得 CRM 商机列表（精简）
export const getSimpleBusinessList = async () => {
  return await request.get({ url: `/crm/business/simple-all-list` })
}

// 新增 CRM 商机
export const createBusiness = async (data: BusinessVO) => {
  return await request.post({ url: `/crm/business/create`, data })
}

// 修改 CRM 商机
export const updateBusiness = async (data: BusinessVO) => {
  return await request.put({ url: `/crm/business/update`, data })
}

// 修改 CRM 商机状态
export const updateBusinessStatus = async (data: BusinessVO) => {
  return await request.put({ url: `/crm/business/update-status`, data })
}

// 删除 CRM 商机
export const deleteBusiness = async (id: number) => {
  return await request.delete({ url: `/crm/business/delete?id=` + id })
}

// 导出 CRM 商机 Excel
export const exportBusiness = async (params) => {
  return await request.download({ url: `/crm/business/export-excel`, params })
}

// 联系人关联商机列表
export const getBusinessPageByContact = async (params) => {
  return await request.get({ url: `/crm/business/page-by-contact`, params })
}

// 商机转移
export const transferBusiness = async (data: TransferReqVO) => {
  return await request.put({ url: '/crm/business/transfer', data })
}
