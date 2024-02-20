import request from '@/config/axios'
// TODO 芋艿：融合下

// 3. 获得分配给我的客户数量
export const getFollowCustomerCount = async () => {
  return await request.get({ url: '/crm/customer/follow-customer-count' })
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
