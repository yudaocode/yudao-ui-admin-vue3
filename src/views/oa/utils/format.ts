import dayjs from 'dayjs'
import { OA_TASK_STATUS } from './constants'

// TODO DONE @AI：移除车辆状态、还车状态、共享类型和共享权限的字典包装，调用处直接使用 getDictLabel。

/** 获得讨论投票方式 */
export function getDiscussionVoteModeName(multiple?: boolean) {
  return multiple ? '多选' : '单选'
}

/** 获得任务状态进度 */
export function getTaskStatusProgress(status?: number) {
  const statuses: number[] = Object.values(OA_TASK_STATUS)
  return status && statuses.includes(status) ? status * 20 : 0
}

/** 获得工作汇报周次：包含 1 月 1 日的周为当年第 1 周 */
export function formatWorkReportWeek(value: string | number) {
  const date = dayjs(value)
  const weekStartTime = date.startOf('day').subtract((date.day() + 6) % 7, 'day')
  // 跨年的同一自然周统一归属周日所在年份
  const year = weekStartTime.add(6, 'day').year()
  const yearStartTime = dayjs(year + '-01-01')
  const firstWeekStartTime = yearStartTime.subtract((yearStartTime.day() + 6) % 7, 'day')
  const weekNumber = Math.floor(weekStartTime.diff(firstWeekStartTime, 'day') / 7) + 1
  return year + '-' + String(weekNumber).padStart(2, '0')
}

/** 获得指定周次的开始日期 */
export function getWorkReportWeekStart(week: string) {
  const [year, weekNumber] = week.split('-').map(Number)
  const yearStartTime = dayjs(year + '-01-01')
  return yearStartTime.subtract((yearStartTime.day() + 6) % 7, 'day').add(weekNumber - 1, 'week')
}

/** 获得周次选择项 */
export function getWorkReportWeekOptions(year: number) {
  const firstWeekStartTime = getWorkReportWeekStart(`${year}-01`)
  const nextYearFirstWeekStartTime = getWorkReportWeekStart(`${year + 1}-01`)
  const weekCount = nextYearFirstWeekStartTime.diff(firstWeekStartTime, 'week')
  return Array.from({ length: weekCount }, (_, index) => {
    const value = year + '-' + String(index + 1).padStart(2, '0')
    const startTime = getWorkReportWeekStart(value)
    return {
      value,
      label: `${year}年第${index + 1}周（${startTime.format('MM-DD')}~${startTime.add(6, 'day').format('MM-DD')}）`
    }
  })
}
