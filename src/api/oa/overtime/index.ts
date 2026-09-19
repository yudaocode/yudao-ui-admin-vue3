import request from '@/config/axios'

export interface OvertimeApplyVO {
  id?: number // 编号
  title?: string // 标题
  urgency?: number // 紧急程度
  type?: number // 加班类型
  startTime?: string // 开始时间
  endTime?: string // 结束时间
  days?: number // 天数
  reason?: string // 申请原因
  status?: number // 审批状态
  processInstanceId?: string // 流程实例编号
  creator?: string // 申请人编号
  creatorName?: string // 申请人昵称
  createTime?: string // 申请时间
  startUserSelectAssignees?: Record<string, number[]> // 发起人自选审批人
}

// 创建加班申请草稿
export const createOvertimeApply = (data: OvertimeApplyVO) => {
  return request.post({ url: '/oa/overtime-apply/create', data })
}

// 查询本人加班申请分页
export const getOvertimeApplyPage = (params: PageParam) => {
  return request.get({ url: '/oa/overtime-apply/page', params })
}

// 查询加班申请详情
export const getOvertimeApply = (id: number) => {
  return request.get({ url: '/oa/overtime-apply/get', params: { id } })
}

// 修改加班申请草稿
export const updateOvertimeApply = (data: OvertimeApplyVO) => {
  return request.put({ url: '/oa/overtime-apply/update', data })
}

// 提交加班申请
export const submitOvertimeApply = (
  id: number,
  startUserSelectAssignees: Record<string, number[]>
) => {
  return request.post({ url: '/oa/overtime-apply/submit', data: { id, startUserSelectAssignees } })
}
