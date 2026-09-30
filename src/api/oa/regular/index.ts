import request from '@/config/axios'

export interface RegularApplyVO {
  id?: number // 编号
  title?: string // 标题
  urgency?: number // 紧急程度
  startTime?: string // 开始时间
  endTime?: string // 结束时间
  days?: number // 天数
  experience?: string // 试用期心得
  understanding?: string // 岗位职责理解
  growth?: string // 试用期成长
  deficiency?: string // 目前不足
  improvement?: string // 工作改进
  suggestion?: string // 产品意见建议
  status?: number // 审批状态
  processInstanceId?: string // 流程实例编号
  creator?: string // 申请人编号
  creatorName?: string // 申请人昵称
  createTime?: string // 申请时间
  startUserSelectAssignees?: Record<string, number[]> // 发起人自选审批人
}

// 创建转正申请草稿
export const createRegularApply = (data: RegularApplyVO) => {
  return request.post({ url: '/oa/regular-apply/create', data })
}

// 查询本人转正申请分页
export const getRegularApplyPage = (params: PageParam) => {
  return request.get({ url: '/oa/regular-apply/page', params })
}

// 查询转正申请详情
export const getRegularApply = (id: number) => {
  return request.get({ url: '/oa/regular-apply/get', params: { id } })
}

// 修改转正申请草稿
export const updateRegularApply = (data: RegularApplyVO) => {
  return request.put({ url: '/oa/regular-apply/update', data })
}

// 提交转正申请
export const submitRegularApply = (
  id: number,
  startUserSelectAssignees: Record<string, number[]>
) => {
  return request.post({ url: '/oa/regular-apply/submit', data: { id, startUserSelectAssignees } })
}
