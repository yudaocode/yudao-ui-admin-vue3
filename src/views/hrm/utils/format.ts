import dayjs from 'dayjs'
import { SolarDay } from 'tyme4ts'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import type { HrmRecruitPostVO } from '@/api/hrm/recruit/post'
import type { HrmAttendanceShift, HrmAttendanceSpecialDate } from '@/api/hrm/attendance/group'
import type { InsuranceSchemeProjectVO } from '@/api/hrm/insurance/scheme'
import type { PerformancePlanVO, PerformanceReviewStageVO } from '@/api/hrm/performance/plan'
import type { SalaryGroupVO } from '@/api/hrm/salary/config/group'
import {
  AGE_UNLIMITED_VALUE,
  HRM_WEEK_OPTIONS,
  HrmAttendanceHolidayType,
  HrmAttendanceLateEarlyDeductMethod,
  HrmEmployeeChangeTypeOptions,
  HrmEmployeeContractStatusOptions,
  HrmEmployeeContractTypeOptions,
  HrmEmployeeIdTypeOptions,
  HrmEmployeeQuitReasonOptions,
  HrmEmployeeQuitTypeOptions,
  HrmEmployeeTeachingMethodOptions,
  HrmInsuranceProjectType,
  HrmPerformanceAppealTimeoutAction,
  HrmPerformanceCycleTypeOptions,
  HrmPerformanceQuotaSettingType,
  HrmPerformanceRaterType,
  SALARY_NEGOTIABLE_VALUE
} from './constants'

/** 格式化 HRM 金额 */
export function formatHrmMoney(value?: number | null): string {
  return Number(value || 0).toFixed(2)
}

/** 格式化带千分位的 HRM 金额 */
export function formatHrmMoneyWithThousands(value?: number | null): string {
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/** 格式化 HRM 比例 */
export function formatHrmRate(value?: number | null): string {
  return value === undefined || value === null ? '-' : `${Number(value).toFixed(2)}%`
}

/** 格式化 HRM 绩效分数 */
export function formatHrmScore(value?: number | null): string {
  return value === undefined || value === null ? '-' : Number(value).toFixed(2)
}

/** 格式化 HRM 参保项目名称 */
export function formatHrmInsuranceProjectName(project: InsuranceSchemeProjectVO): string {
  if (
    project.type === HrmInsuranceProjectType.CUSTOM_SOCIAL_SECURITY ||
    project.type === HrmInsuranceProjectType.CUSTOM_PROVIDENT_FUND
  ) {
    return project.name || '-'
  }
  return getDictLabel(DICT_TYPE.HRM_INSURANCE_PROJECT_TYPE, project.type) || '-'
}

/** 格式化 HRM 天数 */
export function formatHrmDays(value?: number | null): string {
  return Number(value || 0)
    .toFixed(2)
    .replace(/\.00$/, '')
    .replace(/(\.\d)0$/, '$1')
}

/** 格式化薪资组适用范围 */
export function formatSalaryGroupScope(salaryGroup: SalaryGroupVO): string {
  return [...(salaryGroup.deptNames || []), ...(salaryGroup.employeeNames || [])].join('、') || '-'
}

/** 格式化 HRM 年月 */
export function formatHrmYearMonth(year?: number | null, month?: number | null): string {
  if (!year || !month) {
    return '-'
  }
  return `${year}-${String(month).padStart(2, '0')}`
}

/** 格式化 HRM 月份 */
export function formatHrmMonth(value?: dayjs.ConfigType): string {
  if (!value) {
    return '-'
  }
  return dayjs(value).isValid() ? formatDate(value, 'YYYY-MM') : '-'
}

/** 格式化 HRM 系数 */
export function formatHrmCoefficient(value?: number | null): string {
  return value === undefined || value === null ? '-' : Number(value).toFixed(2)
}

/** 格式化 HRM 分析项的字典分类 */
export function formatHrmAnalysisDictType(
  dictType: DICT_TYPE,
  type: number | null | undefined
): string {
  return type == null ? '未填写' : getDictLabel(dictType, type) || '未知'
}

/** 格式化 HRM 分析项的区间分类 */
export function formatHrmAnalysisRangeType(
  rangeNames: Record<number, string>,
  type: number | null | undefined
): string {
  return type == null ? '未填写' : rangeNames[type] || '未知'
}

/** 格式化考勤星期 */
export function formatHrmAttendanceWeeks(weeks?: number[]): string {
  return (
    weeks
      ?.map((week) => HRM_WEEK_OPTIONS.find((item) => item.value === week)?.label)
      .filter(Boolean)
      .join('、') || '-'
  )
}

/** 格式化考勤特殊日期 */
export function formatHrmAttendanceSpecialDate(
  specialDate: HrmAttendanceSpecialDate,
  shifts?: HrmAttendanceShift[]
): string {
  if (specialDate.type === HrmAttendanceHolidayType.REST) {
    return '休息'
  }
  const week = specialDate.date ? dayjs(specialDate.date).day() || 7 : undefined
  const shift = shifts?.find((item) => week && item.weeks.includes(week)) || shifts?.[0]
  return shift ? `${shift.startTime} - ${shift.endTime}` : '上班'
}

/** 格式化迟到早退扣款单位 */
export function formatHrmAttendanceDeductUnit(method: number): string {
  if (method === HrmAttendanceLateEarlyDeductMethod.BY_MINUTE) {
    return '分钟'
  }
  if (method === HrmAttendanceLateEarlyDeductMethod.BY_COUNT) {
    return '次'
  }
  return '月'
}

/** 格式化考勤班次工作时长 */
export function formatHrmAttendanceShiftDuration(shift: HrmAttendanceShift): string {
  let duration = getTimeRangeMinutes(shift.startTime, shift.endTime)
  if (shift.excludeRestTime) {
    duration -= getTimeRangeMinutes(shift.restStartTime, shift.restEndTime)
  }
  duration = Math.max(duration, 0)
  return `${Math.floor(duration / 60)} 小时 ${duration % 60} 分钟`
}

/** 格式化 HRM 日期 */
export function formatHrmDate(value?: dayjs.ConfigType): string {
  if (!value) {
    return '-'
  }
  return dayjs(value).isValid() ? formatDate(value, 'YYYY-MM-DD') : '-'
}

/** 格式化 HRM 日期时间 */
export function formatHrmDateTime(value?: dayjs.ConfigType): string {
  if (!value) {
    return '-'
  }
  return dayjs(value).isValid() ? formatDate(value, 'YYYY-MM-DD HH:mm:ss') : '-'
}

export interface HrmLunarDateInfo {
  dayText: string
  monthDayText: string
}

/** 获得 HRM 日历农历信息 */
export function getHrmLunarDateInfo(value: string): HrmLunarDateInfo {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) {
    return { dayText: '', monthDayText: '' }
  }
  try {
    const solarDay = SolarDay.fromYmd(year, month, day)
    const lunarDay = solarDay.getLunarDay()
    const lunarFestival = lunarDay.getFestival()
    const solarFestival = solarDay.getFestival()
    const lunarDayName = lunarDay.getName()
    return {
      dayText: lunarFestival?.getName() || solarFestival?.getName() || lunarDayName,
      monthDayText: `${lunarDay.getLunarMonth().getName()}${lunarDayName}`
    }
  } catch {
    return { dayText: '', monthDayText: '' }
  }
}

/** 格式化 HRM 日期范围 */
export function formatHrmDateRange(
  startDate?: dayjs.ConfigType,
  endDate?: dayjs.ConfigType
): string {
  if (!startDate && !endDate) {
    return '-'
  }
  return `${formatHrmDate(startDate)} 至 ${formatHrmDate(endDate)}`
}

/** 格式化绩效评分人层级 */
export function formatHrmPerformanceRaterLevel(
  raterType: number | undefined,
  level: number
): string {
  if (raterType === HrmPerformanceRaterType.SUPERIOR) {
    return level === 1 ? '直属上级' : `第 ${level} 级上级`
  }
  return level === 1 ? '直属部门负责人' : `第 ${level} 级部门负责人`
}

/** 格式化绩效评分阶段名称 */
export function formatHrmPerformanceReviewStageName(stage: PerformanceReviewStageVO): string {
  if (stage.rater?.type === HrmPerformanceRaterType.SELF) {
    return '员工自评'
  }
  if (
    stage.rater?.type === HrmPerformanceRaterType.SUPERIOR ||
    stage.rater?.type === HrmPerformanceRaterType.DEPT_LEADER
  ) {
    return `${formatHrmPerformanceRaterLevel(stage.rater.type, stage.rater.level || 1)}评分`
  }
  return '指定员工评分'
}

/** 格式化绩效计划周期 */
export function formatHrmPerformancePlanCycle(plan: PerformancePlanVO): string {
  return (
    [plan.cycle, plan.quarter ? `第 ${plan.quarter} 季度` : ''].filter(Boolean).join(' / ') || '-'
  )
}

/** 格式化绩效考核周期类型 */
export function formatHrmPerformanceCycleType(type?: number): string {
  return HrmPerformanceCycleTypeOptions.find((item) => item.value === type)?.label || '-'
}

/** 格式化绩效指标制定方式 */
export function formatHrmPerformanceQuotaSettingType(type?: number): string {
  if (type === HrmPerformanceQuotaSettingType.SYSTEM) {
    return '系统制定'
  }
  return type === HrmPerformanceQuotaSettingType.EMPLOYEE ? '员工制定' : '-'
}

/** 格式化绩效申诉超期处理方式 */
export function formatHrmPerformanceAppealTimeout(plan: PerformancePlanVO): string {
  if (!plan.resultConfirmation || !plan.appealTimeoutDays) {
    return '-'
  }
  const action = {
    [HrmPerformanceAppealTimeoutAction.REJECT]: '自动拒绝',
    [HrmPerformanceAppealTimeoutAction.APPROVE]: '自动通过'
  }[plan.appealTimeoutAction || 0]
  return action ? `超过 ${plan.appealTimeoutDays} 天未处理，${action}` : '-'
}

/** 格式化绩效评分人类型 */
export function formatHrmPerformanceRaterType(type?: number): string {
  return (
    {
      [HrmPerformanceRaterType.SUPERIOR]: '上级',
      [HrmPerformanceRaterType.DEPT_LEADER]: '部门负责人',
      [HrmPerformanceRaterType.SPECIFIED]: '指定评分人',
      [HrmPerformanceRaterType.SELF]: '被考核人'
    }[type || 0] || '-'
  )
}

/** 格式化员工证件类型 */
export function formatEmployeeIdType(value?: number): string {
  return HrmEmployeeIdTypeOptions.find((item) => item.value === value)?.label || '-'
}

/** 格式化员工异动类型 */
export function formatEmployeeChangeType(value?: number): string {
  return HrmEmployeeChangeTypeOptions.find((item) => item.value === value)?.label || '-'
}

/** 格式化员工教学方式 */
export function formatEmployeeTeachingMethod(value?: number): string {
  return HrmEmployeeTeachingMethodOptions.find((item) => item.value === value)?.label || '-'
}

/** 格式化员工合同类型 */
export function formatEmployeeContractType(value?: number): string {
  return HrmEmployeeContractTypeOptions.find((item) => item.value === value)?.label || '-'
}

/** 格式化员工合同状态 */
export function formatEmployeeContractStatus(value?: number): string {
  return HrmEmployeeContractStatusOptions.find((item) => item.value === value)?.label || '-'
}

/** 格式化员工离职类型 */
export function formatEmployeeQuitType(value?: number): string {
  return HrmEmployeeQuitTypeOptions.find((item) => item.value === value)?.label || '-'
}

/** 格式化员工离职原因 */
export function formatEmployeeQuitReason(value?: number): string {
  return HrmEmployeeQuitReasonOptions.find((item) => item.value === value)?.label || '-'
}

/** 格式化 HRM 是否值 */
export function formatHrmYesNo(value?: boolean | null): string {
  if (value === undefined || value === null) {
    return '-'
  }
  return value ? '是' : '否'
}

/** 格式化招聘职位薪资范围 */
export function formatRecruitPostSalary(post: HrmRecruitPostVO): string {
  if (post.minSalary === SALARY_NEGOTIABLE_VALUE && post.maxSalary === SALARY_NEGOTIABLE_VALUE) {
    return '面议'
  }
  const salaryRange = [post.minSalary, post.maxSalary]
    .filter((salary) => salary !== undefined && salary !== null)
    .join('-')
  if (!salaryRange) {
    return '-'
  }
  const salaryUnit =
    post.salaryUnit !== undefined && post.salaryUnit !== null
      ? getDictLabel(DICT_TYPE.HRM_RECRUIT_SALARY_UNIT, post.salaryUnit)
      : ''
  return [salaryRange, salaryUnit].filter(Boolean).join(' ')
}

/** 格式化招聘职位年龄要求 */
export function formatRecruitPostAge(post: HrmRecruitPostVO): string {
  if (post.minAge === AGE_UNLIMITED_VALUE && post.maxAge === AGE_UNLIMITED_VALUE) {
    return '不限'
  }
  const hasMinAge = post.minAge !== undefined && post.minAge !== null
  const hasMaxAge = post.maxAge !== undefined && post.maxAge !== null
  if (hasMinAge && hasMaxAge) {
    return `${post.minAge}-${post.maxAge}`
  }
  if (hasMinAge) {
    return `${post.minAge} 岁以上`
  }
  if (hasMaxAge) {
    return `${post.maxAge} 岁以下`
  }
  return '-'
}

/** 格式化招聘职位进度百分比 */
export function formatRecruitPostSchedule(post: HrmRecruitPostVO): string {
  return post.recruitSchedule === undefined || post.recruitSchedule === null
    ? '-'
    : `${post.recruitSchedule}%`
}

/** 格式化招聘职位进度 */
export function formatRecruitPostProgress(post: HrmRecruitPostVO): string {
  const joinedCount = post.hasEntryNum ?? 0
  const recruitCount = post.recruitNum ?? 0
  if (!recruitCount) {
    return `${joinedCount} / ${recruitCount}`
  }
  return `${joinedCount} / ${recruitCount}（${post.recruitSchedule ?? 0}%）`
}

/** 计算时间范围的分钟数 */
function getTimeRangeMinutes(startTime?: string, endTime?: string): number {
  if (!startTime || !endTime) {
    return 0
  }
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  const start = startHour * 60 + startMinute
  let end = endHour * 60 + endMinute
  if (end <= start) {
    end += 24 * 60
  }
  return end - start
}
