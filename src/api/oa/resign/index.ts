import request from '@/config/axios'

export interface ResignApplyVO {
  id?: number // 编号
  title?: string // 标题
  urgency?: number // 紧急程度
  reason?: string // 申请原因
  handoverUserId?: number // 工作交接人
  unfinishedWork?: string // 未完成事宜
  hasPendingReimbursement?: boolean // 是否有费用报销未完成
  suggestion?: string // 申请人意见建议
  status?: number // 审批状态
  processInstanceId?: string // 流程实例编号
  creator?: string // 申请人编号
  creatorName?: string // 申请人昵称
  createTime?: string // 申请时间
  startUserSelectAssignees?: Record<string, number[]> // 发起人自选审批人
}

// 创建离职申请草稿
export const createResignApply = (data: ResignApplyVO) => {
  return request.post({ url: '/oa/resign-apply/create', data })
}

// 查询本人离职申请分页
export const getResignApplyPage = (params: PageParam) => {
  return request.get({ url: '/oa/resign-apply/page', params })
}

// 查询离职申请详情
export const getResignApply = (id: number) => {
  return request.get({ url: '/oa/resign-apply/get', params: { id } })
}

// 修改离职申请草稿
export const updateResignApply = (data: ResignApplyVO) => {
  return request.put({ url: '/oa/resign-apply/update', data })
}

// 提交离职申请
export const submitResignApply = (
  id: number,
  startUserSelectAssignees: Record<string, number[]>
) => {
  return request.post({ url: '/oa/resign-apply/submit', data: { id, startUserSelectAssignees } })
}
