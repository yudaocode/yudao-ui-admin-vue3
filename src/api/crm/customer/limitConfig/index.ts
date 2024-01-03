import request from '@/config/axios'

export interface CustomerLimitConfigVO {
  id?: number
  type?: number
  userIds?: string
  deptIds?: string
  maxCount?: number
  dealCountEnabled?: boolean
}

/**
 * 客户限制配置类型
 */
export enum LimitConfType {
  /**
   * 拥有客户数限制
   */
  CUSTOMER_QUANTITY_LIMIT = 1,
  /**
   * 锁定客户数限制
   */
  CUSTOMER_LOCK_LIMIT = 2
}

// 查询客户限制配置列表
export const getCustomerLimitConfigPage = async (params) => {
  return await request.get({ url: `/crm/customer-limit-config/page`, params })
}

// 查询客户限制配置详情
export const getCustomerLimitConfig = async (id: number) => {
  return await request.get({ url: `/crm/customer-limit-config/get?id=` + id })
}

// 新增客户限制配置
export const createCustomerLimitConfig = async (data: CustomerLimitConfigVO) => {
  return await request.post({ url: `/crm/customer-limit-config/create`, data })
}

// 修改客户限制配置
export const updateCustomerLimitConfig = async (data: CustomerLimitConfigVO) => {
  return await request.put({ url: `/crm/customer-limit-config/update`, data })
}

// 删除客户限制配置
export const deleteCustomerLimitConfig = async (id: number) => {
  return await request.delete({ url: `/crm/customer-limit-config/delete?id=` + id })
}
