import request from '@/config/axios'

export interface CustomerPoolConfigVO {
  enabled?: boolean
  contactExpireDays?: number
  dealExpireDays?: number
  notifyEnabled?: boolean
  notifyDays?: number
}

// 获取客户公海规则设置
export const getCustomerPoolConfig = async () => {
  return await request.get({ url: `/crm/customer-pool-config/get` })
}

// 更新客户公海规则设置
export const saveCustomerPoolConfig = async (data: CustomerPoolConfigVO) => {
  return await request.put({ url: `/crm/customer-pool-config/save`, data })
}
