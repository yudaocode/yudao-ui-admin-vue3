import request from '@/config/axios'

export interface TravelApplyVO {
  id?: number // 编号
  no?: string // 单据编号
  reason?: string // 出差事由
  startTime?: string | number // 开始日期
  endTime?: string | number // 结束日期
  days?: number // 出差天数
  companion?: string // 同行人
  estimatedPrice?: number // 预计费用
  reimburseStatus?: boolean // 报销状态
  status?: number // 审批状态
  processInstanceId?: string // 流程实例编号
  creator?: string // 申请人编号
  creatorName?: string // 申请人姓名
  deptId?: number // 申请部门编号
  deptName?: string // 申请部门名称
  createTime?: string | number // 创建时间
  remark?: string // 备注
  items: TravelApplyItemVO[] // 明细
  fileUrls: string[] // 附件地址列表
}

export interface TravelApplyItemVO {
  departureAreaId?: number // 出发地区编号
  arrivalAreaId?: number // 到达地区编号
  startTime?: string | number // 开始日期
  endTime?: string | number // 结束日期
  transportType?: number // 交通方式
  remark?: string // 备注
}

// 获得本人出差申请分页
export const getTravelApplyPage = (params: PageParam) => {
  return request.get({ url: '/oa/travel-apply/page', params })
}

// 获得本人已通过的出差申请
export const getApprovedTravelApplyList = () => {
  return request.get({ url: '/oa/travel-apply/approved-list' })
}

// 获得出差申请详情
export const getTravelApply = (id: number) => {
  return request.get({ url: '/oa/travel-apply/get', params: { id } })
}

// 创建出差申请草稿
export const createTravelApply = (data: TravelApplyVO) => {
  return request.post({ url: '/oa/travel-apply/create', data })
}

// 修改出差申请草稿
export const updateTravelApply = (data: TravelApplyVO) => {
  return request.put({ url: '/oa/travel-apply/update', data })
}

// 提交出差申请
export const submitTravelApply = (id: number) => {
  return request.post({ url: '/oa/travel-apply/submit', data: { id } })
}

// 撤回出差申请
export const cancelTravelApply = (id: number) => {
  return request.put({ url: '/oa/travel-apply/cancel', params: { id } })
}

// 删除出差申请
export const deleteTravelApply = (id: number) => {
  return request.delete({ url: '/oa/travel-apply/delete', params: { id } })
}
