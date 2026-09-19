import request from '@/config/axios'

export interface ReimbursementVO {
  id?: number // 编号
  title?: string // 标题
  urgency?: number // 紧急程度
  reason?: string // 申请原因
  witnessUserId?: number // 证明人
  customerName?: string // 相关客户
  paymentMethod?: number // 报销方式
  invoiceCount?: number // 票据总数
  totalPrice?: number // 报销总金额
  status?: number // 审批状态
  processInstanceId?: string // 流程实例编号
  items?: Item[] // 报销明细
  fileUrls: string[] // 附件地址列表
  creator?: string // 申请人编号
  creatorName?: string // 申请人昵称
  createTime?: string // 申请时间
  startUserSelectAssignees?: Record<string, number[]> // 发起人自选审批人
}

export interface Item {
  expenseTime?: string // 费用发生时间
  expenseType?: number // 费用类型
  description?: string // 费用说明
  invoiceCount?: number // 票据张数
  price?: number // 报销金额
}

// 创建费用报销草稿
export const createReimbursement = (data: ReimbursementVO) => {
  return request.post({ url: '/oa/reimbursement/create', data })
}

// 查询本人费用报销分页
export const getReimbursementPage = (params: PageParam) => {
  return request.get({ url: '/oa/reimbursement/page', params })
}

// 查询费用报销详情
export const getReimbursement = (id: number) => {
  return request.get({ url: '/oa/reimbursement/get', params: { id } })
}

// 修改费用报销草稿
export const updateReimbursement = (data: ReimbursementVO) => {
  return request.put({ url: '/oa/reimbursement/update', data })
}

// 提交费用报销
export const submitReimbursement = (
  id: number,
  startUserSelectAssignees: Record<string, number[]>
) => {
  return request.post({ url: '/oa/reimbursement/submit', data: { id, startUserSelectAssignees } })
}
