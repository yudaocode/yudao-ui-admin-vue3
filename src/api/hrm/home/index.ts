import request from '@/config/axios'

// HRM 首页员工概览 VO
export interface HrmHrHomeEmployeeSurveyVO {
  activeCount: number // 在职员工数量
  entryThisMonthCount: number // 本月入职员工数量
  pendingEntryThisMonthCount: number // 本月待入职员工数量
  leaveThisMonthCount: number // 本月离职员工数量
  pendingLeaveThisMonthCount: number // 本月待离职员工数量
  regularThisMonthCount: number // 本月转正员工数量
  transferThisMonthCount: number // 本月调岗员工数量
}

// HRM 首页招聘概览 VO
export interface HrmHrHomeRecruitSurveyVO {
  recruitingPostCount: number // 招聘中职位数量
  candidateInProcessCount: number // 流程中候选人数量
  pendingEntryCount: number // 待入职候选人数量
  joinedCount: number // 已入职候选人数量
}

// HRM 首页部门薪资占比 VO
export interface HrmHrHomeSalaryDeptVO {
  deptId: number // 部门编号
  deptName: string // 部门名称
  proportion: number // 薪资占比
  totalSalary: number // 实发工资
}

// HRM 首页薪资概览 VO
export interface HrmHrHomeSalarySurveyVO {
  monthRecordId?: number // 月度工资表编号
  employeeCount: number // 计薪员工数量
  realPaySalary: number // 实发工资合计
  deptProportions: HrmHrHomeSalaryDeptVO[] // 部门薪资占比
}

// HRM 首页待办概览 VO
export interface HrmHrHomeTodoSurveyVO {
  toEntryCount: number // 待入职数量
  toLeaveCount: number // 待离职数量
  toExpireContractCount: number // 合同待到期数量
  toRegularCount: number // 待转正数量
  toSalaryComputeCount: number // 待核算工资表数量
  toBirthdayCount: number // 本月生日员工数量
}

// HRM 首页统计响应 VO
export interface HrmHrHomeStatisticsRespVO {
  employeeSurvey: HrmHrHomeEmployeeSurveyVO // 员工概览
  recruitSurvey: HrmHrHomeRecruitSurveyVO // 招聘概览
  salarySurvey: HrmHrHomeSalarySurveyVO // 薪资概览
  todoSurvey: HrmHrHomeTodoSurveyVO // 待办概览
}

// HRM 团队工作台统计分析项 VO
export interface HrmTeamHomeAnalysisItemVO {
  type: number | null // 分类类型，null 表示未填写
  count: number // 数量
}

// HRM 团队工作台我的团队 VO
export interface HrmTeamHomeOverviewVO {
  employeeCount: number // 团队人数
  entryThisMonthCount: number // 本月入职人数
  leaveThisMonthCount: number // 本月离职人数
  regularThisMonthCount: number // 本月转正人数
}

// HRM 团队工作台团队概况 VO
export interface HrmTeamHomeSurveyVO {
  statusAnalysis: HrmTeamHomeAnalysisItemVO[] // 员工状态占比
  sexAnalysis: HrmTeamHomeAnalysisItemVO[] // 男女性别占比
  ageAnalysis: HrmTeamHomeAnalysisItemVO[] // 成员年龄占比
  companyAgeAnalysis: HrmTeamHomeAnalysisItemVO[] // 成员司龄占比
}

// HRM 团队工作台统计响应 VO
export interface HrmTeamHomeStatisticsRespVO {
  leaderEmployeeId?: number // 当前登录员工编号
  teamOverview: HrmTeamHomeOverviewVO // 我的团队
  teamSurvey: HrmTeamHomeSurveyVO // 团队概况
}

// HRM 首页日历事项 VO
export interface HrmHomeCalendarItemVO {
  personalNoteId?: number // 员工个人备忘编号
  type: number // 事项类型
  typeName: string // 事项类型名称
  content: string // 事项内容
  typeId?: number // 关联业务编号
  date: [number, number, number] | string // 事项日期
  eventTime?: Date // 事项时间
}

// 获得 HRM 首页统计汇总
export const getHrHomeStatisticsSummary = async () => {
  return await request.get<HrmHrHomeStatisticsRespVO>({ url: '/hrm/home/hr-statistics-summary' })
}

// 获得 HR 工作台日历
export const getHrHomeCalendar = async (params: { startDate: string; endDate: string }) => {
  return await request.get<HrmHomeCalendarItemVO[]>({
    url: '/hrm/home/hr-calendar',
    params
  })
}

// 获得 HRM 团队工作台统计汇总
export const getTeamHomeStatisticsSummary = async () => {
  return await request.get<HrmTeamHomeStatisticsRespVO>({
    url: '/hrm/home/team-statistics-summary'
  })
}

// 获得 HRM 团队工作台日历
export const getTeamHomeCalendar = async (params: { startDate: string; endDate: string }) => {
  return await request.get<HrmHomeCalendarItemVO[]>({
    url: '/hrm/home/team-calendar',
    params
  })
}
