import request from '@/config/axios'

export interface TravelReimbursementVO {
  id?: number // 编号
  no?: string // 单据编号
  reason?: string // 出差事由
  startTime?: string | number // 开始日期
  endTime?: string | number // 结束日期
  days?: number // 出差天数
  travelApplyId?: number // 关联出差申请编号
  travelApplyNo?: string // 关联出差单号
  totalPrice?: number // 报销总金额
  payStatus?: boolean // 支付状态
  status?: number // 审批状态
  processInstanceId?: string // 流程实例编号
  creator?: string // 申请人编号
  creatorName?: string // 申请人姓名
  deptId?: number // 申请部门编号
  deptName?: string // 申请部门名称
  createTime?: string | number // 创建时间
  remark?: string // 备注
  items: TravelReimbursementItemVO[] // 明细
  fileUrls: string[] // 附件地址列表
}

export interface TravelReimbursementItemVO {
  expenseType?: number // 费用类型
  expenseTime?: string | number // 发生日期
  departureCity?: string // 出发地
  arrivalCity?: string // 到达地
  price?: number // 金额
  description?: string // 费用说明
}

// 获得本人出差报销分页
export const getTravelReimbursementPage = (params: PageParam) => {
  return request.get({ url: '/oa/travel-reimbursement/page', params })
}

// 获得出差报销详情
export const getTravelReimbursement = (id: number) => {
  return request.get({ url: '/oa/travel-reimbursement/get', params: { id } })
}

// 创建出差报销草稿
export const createTravelReimbursement = (data: TravelReimbursementVO) => {
  return request.post({ url: '/oa/travel-reimbursement/create', data })
}

// 修改出差报销草稿
export const updateTravelReimbursement = (data: TravelReimbursementVO) => {
  return request.put({ url: '/oa/travel-reimbursement/update', data })
}

// 提交出差报销
export const submitTravelReimbursement = (id: number) => {
  return request.post({
    url: '/oa/travel-reimbursement/submit',
    data: { id }
  })
}

// 撤回出差报销
export const cancelTravelReimbursement = (id: number) => {
  return request.put({ url: '/oa/travel-reimbursement/cancel', params: { id } })
}

// 删除出差报销
export const deleteTravelReimbursement = (id: number) => {
  return request.delete({ url: '/oa/travel-reimbursement/delete', params: { id } })
}
