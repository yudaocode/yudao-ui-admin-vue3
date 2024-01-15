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
// TODO @芋艿：看看是不是后续融合到 getCustomerPage 里；
export const getTodayCustomerPage = async (params) => {
  return await request.get({ url: `/crm/message/todayCustomer`, params })
}
