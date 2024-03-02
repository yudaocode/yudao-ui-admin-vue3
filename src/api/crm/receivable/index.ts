import request from '@/config/axios'

export interface ReceivableVO {
  id: number
  no: string
  planId?: number
  customerId?: number
  customerName?: string
  contractId?: number
  contract?: {
    id?: number
    name?: string
    no: string
    totalPrice: number
  }
  auditStatus: number
  processInstanceId: number
  returnTime: Date
  returnType: number
  price: number
  ownerUserId: number
  ownerUserName?: string
  remark: string
  creator: string // 创建人
  creatorName?: string // 创建人名称
  createTime: Date // 创建时间
  updateTime: Date // 更新时间
}

// 查询回款列表
export const getReceivablePage = async (params) => {
  return await request.get({ url: `/crm/receivable/page`, params })
}

// 查询回款列表
export const getReceivablePageByCustomer = async (params) => {
  return await request.get({ url: `/crm/receivable/page-by-customer`, params })
}

// 查询回款详情
export const getReceivable = async (id: number) => {
  return await request.get({ url: `/crm/receivable/get?id=` + id })
}

// 新增回款
export const createReceivable = async (data: ReceivableVO) => {
  return await request.post({ url: `/crm/receivable/create`, data })
}

// 修改回款
export const updateReceivable = async (data: ReceivableVO) => {
  return await request.put({ url: `/crm/receivable/update`, data })
}

// 删除回款
export const deleteReceivable = async (id: number) => {
  return await request.delete({ url: `/crm/receivable/delete?id=` + id })
}

// 导出回款 Excel
export const exportReceivable = async (params) => {
  return await request.download({ url: `/crm/receivable/export-excel`, params })
}

// 提交审核
export const submitReceivable = async (id: number) => {
  return await request.put({ url: `/crm/receivable/submit?id=${id}` })
}

// 获得待审核回款数量
export const getAuditReceivableCount = async () => {
  return await request.get({ url: '/crm/receivable/audit-count' })
}
