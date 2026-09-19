import request from '@/config/axios'

export interface OaWorkReportWorkItemVO {
  content: string // 工作内容
  progress: number // 完成进度
}

export interface OaWorkReportPlanItemVO {
  content: string // 计划内容
}

export interface OaWorkReportVO {
  id?: number // 汇报编号
  no?: string // 汇报单号
  type: number // 汇报类型
  status?: number // 汇报状态
  title?: string // 汇报标题
  periodKey?: string // 汇报周期标识
  startTime: string | number // 周期开始时间
  endTime: string | number // 周期结束时间
  summary?: string // 工作总结
  plan?: string // 工作计划补充说明
  problem?: string // 问题与协调事项
  workItems: OaWorkReportWorkItemVO[] // 已完成工作项
  planItems: OaWorkReportPlanItemVO[] // 工作计划项
  fileUrls: string[] // 附件地址列表
  remark?: string // 备注
  userId?: number // 汇报人用户编号
  userName?: string // 汇报人昵称
  deptId?: number // 汇报人部门编号
  deptName?: string // 汇报人部门名称
  createTime?: string // 创建时间
  updateTime?: string // 更新时间
}

export interface OaWorkReportStatisticsReportVO {
  id: number // 汇报编号
  no: string // 汇报单号
  title: string // 汇报标题
  periodKey: string // 汇报周期标识
  status: number // 汇报状态
  startTime: string | number // 开始日期
  createTime: string | number // 创建时间
}

export interface OaWorkReportUserStatisticsVO {
  userId: number // 员工用户编号
  userName: string // 员工昵称
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  expectedCount: number // 应填数量
  submittedCount: number // 已填数量
  missingCount: number // 未填数量
  submittedReports: OaWorkReportStatisticsReportVO[] // 已提交汇报
  missingPeriodKeys: string[] // 未填周期
}

export interface OaWorkReportStatisticsVO {
  userCount: number // 统计人数
  expectedCount: number // 应填数量
  submittedCount: number // 已填数量
  missingCount: number // 未填数量
  users: OaWorkReportUserStatisticsVO[] // 员工统计列表
}

export interface OaWorkReportStatisticsReqVO {
  type: number // 汇报类型
  startTime: string // 统计开始时间
  endTime: string // 统计结束时间
  queryStartTime: string // 完整周期查询开始时间
  queryEndTime: string // 完整周期查询结束时间
  deptId?: number // 部门编号
}

// 查询我的工作汇报分页
export const getWorkReportPage = (params: PageParam) => {
  return request.get({ url: '/oa/work-report/page', params })
}

// 查询工作汇报详情
export const getWorkReport = (id: number) => {
  return request.get({ url: '/oa/work-report/get?id=' + id })
}

// 新增工作汇报草稿
export const createWorkReport = (data: OaWorkReportVO) => {
  return request.post({ url: '/oa/work-report/create', data })
}

// 修改工作汇报草稿
export const updateWorkReport = (data: OaWorkReportVO) => {
  return request.put({ url: '/oa/work-report/update', data })
}

// 删除工作汇报草稿
export const deleteWorkReport = (id: number) => {
  return request.delete({ url: '/oa/work-report/delete?id=' + id })
}

// 提交工作汇报
export const submitWorkReport = (id: number) => {
  return request.put({ url: '/oa/work-report/submit?id=' + id })
}

// 取消提交工作汇报
export const cancelWorkReport = (id: number) => {
  return request.put({ url: '/oa/work-report/cancel?id=' + id })
}

// 查询工作汇报统计
export const getWorkReportStatistics = (params: OaWorkReportStatisticsReqVO) => {
  return request.get({ url: '/oa/work-report/statistics', params })
}
