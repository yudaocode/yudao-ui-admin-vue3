import request from '@/config/axios'

// 1. 获得今日需联系客户数量
export const getTodayCustomerCount = async () => {
  return await request.get({ url: '/crm/customer/today-customer-count' })
}

// 2. 获得分配给我的线索数量
export const getFollowLeadsCount = async () => {
  return await request.get({ url: '/crm/clue/follow-leads-count' })
}

// 3. 获得分配给我的客户数量
export const getFollowCustomerCount = async () => {
  return await request.get({ url: '/crm/customer/follow-customer-count' })
}

// 4. 获得待进入公海的客户数量
export const getPutInPoolCustomerRemindCount = async () => {
  return await request.get({ url: '/crm/customer/put-in-pool-remind-count' })
}

// 5. 获得待审核合同数量
export const getCheckContractCount = async () => {
  return await request.get({ url: '/crm/contract/check-contract-count' })
}

// 6. 获得待审核回款数量
export const getCheckReceivablesCount = async () => {
  return await request.get({ url: '/crm/receivable/check-receivables-count' })
}

// 7. 获得待回款提醒数量
export const getRemindReceivablePlanCount = async () => {
  return await request.get({ url: '/crm/receivable-plan/remind-receivable-plan-count' })
}

// 8. 获得即将到期的合同数量
export const getEndContractCount = async () => {
  return await request.get({ url: '/crm/contract/end-contract-count' })
}
