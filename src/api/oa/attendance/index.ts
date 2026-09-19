import request from '@/config/axios'

// TODO DONE @AI：VO 字段统一补充尾注释，对齐 System User API 风格。
export interface OaAttendanceVO {
  id: number // 考勤编号
  userId: number // 用户编号
  userName?: string // 用户名称
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  type: number // 考勤类型
  status: number // 考勤状态
  attendanceTime: string // 考勤时间
  attendanceIp?: string // 考勤 IP
  remark?: string // 备注
  createTime: string // 创建时间
}

export interface OaAttendanceWeekReportVO {
  userId: number // 用户编号
  userName?: string // 用户名称
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  // TODO DONE @AI：日考勤只属于周报明细，直接内嵌，避免创建低价值的独立 VO。
  dailyAttendances: {
    date: string // 日期
    clockInTime?: string // 上班打卡时间
    clockInStatus?: number // 上班打卡状态
    clockOutTime?: string // 下班打卡时间
    clockOutStatus?: number // 下班打卡状态
  }[] // 每日考勤列表
}

export interface OaAttendanceMonthReportVO {
  userId: number // 用户编号
  userName?: string // 用户名称
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  clockInCount: number // 上班打卡次数
  clockOutCount: number // 下班打卡次数
  normalCount: number // 正常次数
  lateCount: number // 迟到次数
  earlyCount: number // 早退次数
  missingClockOutDays: number // 缺少下班打卡天数
}

// 查询考勤记录分页
export const getAttendancePage = (params: PageParam) => {
  return request.get({ url: '/oa/attendance/page', params })
}

// 查询我的考勤记录分页
export const getMyAttendancePage = (params: PageParam) => {
  return request.get({ url: '/oa/attendance/my-page', params })
}

// 查询考勤记录详情
export const getAttendance = (id: number) => {
  return request.get({ url: '/oa/attendance/get?id=' + id })
}

// 查询我的今日考勤记录
export const getMyTodayAttendanceList = (): Promise<OaAttendanceVO[]> => {
  return request.get({ url: '/oa/attendance/my-today-list' })
}

// 执行当前用户打卡
export const clockAttendance = () => {
  return request.post({ url: '/oa/attendance/clock' })
}

// 修改考勤记录
export const updateAttendance = (data: OaAttendanceVO) => {
  return request.put({ url: '/oa/attendance/update', data })
}

// 删除考勤记录
export const deleteAttendance = (id: number) => {
  return request.delete({ url: '/oa/attendance/delete?id=' + id })
}

// 查询考勤周报
export const getAttendanceWeekReport = (params: {
  startDate: string // 周开始日期
  userId?: number // 用户编号
}): Promise<OaAttendanceWeekReportVO[]> => {
  return request.get({ url: '/oa/attendance/week-report', params })
}

// 查询考勤月报
export const getAttendanceMonthReport = (params: {
  year: number // 年份
  month: number // 月份
  userId?: number // 用户编号
}): Promise<OaAttendanceMonthReportVO[]> => {
  return request.get({ url: '/oa/attendance/month-report', params })
}
