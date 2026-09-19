import request from '@/config/axios'

export interface OaPlanVO {
  id?: number // 计划编号
  userId?: number // 用户编号
  userName?: string // 用户昵称
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  type: number // 计划类型
  status: number // 计划状态
  title: string // 标题
  label?: string // 标签
  content: string // 计划内容
  summary?: string // 计划总结
  comment?: string // 计划点评
  startTime: string | number // 开始时间
  endTime: string | number // 结束时间
  fileUrls: string[] // 附件地址列表
  createTime?: string // 创建时间
}

export interface OaPlanReportVO {
  userId: number // 用户编号
  userName: string // 用户昵称
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  planId?: number // 计划编号
  status?: number // 计划状态
  title?: string // 标题
  label?: string // 标签
  content?: string // 计划内容
  summary?: string // 计划总结
  comment?: string // 计划点评
  fileUrls?: string[] // 附件地址列表
  createTime?: string // 创建时间
}

// 查询工作计划分页
export const getPlanPage = (params: PageParam) => {
  return request.get({ url: '/oa/plan/page', params })
}

// 查询工作计划报表分页
export const getPlanReportPage = (params: PageParam) => {
  return request.get({ url: '/oa/plan/report-page', params })
}

// 查询工作计划详情
export const getPlan = (id: number) => {
  return request.get({ url: '/oa/plan/get', params: { id } })
}

// 新增工作计划
export const createPlan = (data: OaPlanVO) => {
  return request.post({ url: '/oa/plan/create', data })
}

// 修改工作计划
export const updatePlan = (data: OaPlanVO) => {
  return request.put({ url: '/oa/plan/update', data })
}

// 删除工作计划
export const deletePlan = (id: number) => {
  return request.delete({ url: '/oa/plan/delete', params: { id } })
}

// 点评工作计划
export const addPlanComment = (id: number, comment: string) => {
  return request.put({ url: '/oa/plan/add-comment', data: { id, comment } })
}
