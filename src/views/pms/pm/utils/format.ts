import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import dayjs from 'dayjs'
import type { PmsProjectVO } from '@/api/pms/pm/project'
import {
  PmsIterationStatus,
  PmsProjectGroupType,
  PmsProjectType,
  PmsWorkItemPriority,
  PmsWorkItemStatusType,
  PmsWorkItemType
} from './constants'

/** 获得工作项类型名称 */
export function getWorkItemTypeName(type: number) {
  return getDictLabel(DICT_TYPE.PMS_WORK_ITEM_TYPE, type) || '-'
}

/** 获得工作项类型编码 */
export function getWorkItemTypeCode(type: number) {
  return (
    {
      [PmsWorkItemType.REQUIREMENT]: 'requirement',
      [PmsWorkItemType.TASK]: 'task',
      [PmsWorkItemType.DEFECT]: 'defect'
    }[type] || 'task'
  )
}

/** 获得工作项优先级名称 */
export function getPriorityName(priority?: number) {
  return getDictLabel(DICT_TYPE.PMS_WORK_ITEM_PRIORITY, priority) || '-'
}

/** 获得工作项缺陷类型名称 */
export function getWorkItemDefectTypeName(defectType?: number) {
  return getDictLabel(DICT_TYPE.PMS_WORK_ITEM_DEFECT_TYPE, defectType) || '-'
}

/** 获得工作项优先级标签类型 */
export function getPriorityTagType(priority?: number) {
  return {
    [PmsWorkItemPriority.NONE]: 'info',
    [PmsWorkItemPriority.LOW]: 'info',
    [PmsWorkItemPriority.MEDIUM]: 'warning',
    [PmsWorkItemPriority.HIGH]: 'danger'
  }[priority ?? -1] as 'info' | 'warning' | 'danger'
}

/** 获得工作项优先级颜色 */
export function getPriorityColor(priority?: number) {
  return (
    {
      [PmsWorkItemPriority.NONE]: 'var(--el-text-color-secondary)',
      [PmsWorkItemPriority.LOW]: 'var(--el-color-success)',
      [PmsWorkItemPriority.MEDIUM]: 'var(--el-color-warning)',
      [PmsWorkItemPriority.HIGH]: 'var(--el-color-danger)'
    }[priority ?? -1] || 'var(--el-text-color-secondary)'
  )
}

/** 获得工作项状态标签类型 */
export function getWorkItemStatusTagType(status?: number) {
  return {
    [PmsWorkItemStatusType.PENDING]: 'info',
    [PmsWorkItemStatusType.PROCESSING]: 'warning',
    [PmsWorkItemStatusType.COMPLETED]: 'success'
  }[status ?? -1] as 'info' | 'warning' | 'success'
}

/** 获得迭代状态名称 */
export function getIterationStatusName(status?: number) {
  if (status === undefined) {
    return '-'
  }
  return getDictLabel(DICT_TYPE.PMS_ITERATION_STATUS, status) || '-'
}

/** 获得迭代状态标签类型 */
export function getIterationStatusTagType(status?: number) {
  return {
    [PmsIterationStatus.PLANNED]: 'info',
    [PmsIterationStatus.ACTIVE]: 'primary',
    [PmsIterationStatus.COMPLETED]: 'success'
  }[status ?? -1] as 'info' | 'primary' | 'success'
}

/** 获得项目分组类型名称 */
export function getProjectGroupTypeName(type?: number) {
  return type === PmsProjectGroupType.CUSTOM ? '自定义分组' : '默认分组'
}

/** 格式化包含中文星期的日期 */
export function formatDateWithWeekday(date: string) {
  return `${dayjs(date).format('MM-DD')}/周${'日一二三四五六'[dayjs(date).day()]}`
}

/** 移除 HTML 标签并合并空白字符 */
export function stripHtmlTags(content: string) {
  return content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 格式化项目类型 */
export function formatProjectType(type: number) {
  return getDictLabel(DICT_TYPE.PMS_PROJECT_TYPE, type) || '-'
}

/** 格式化项目类型简称 */
export function formatProjectTypeShort(type: number) {
  return type === PmsProjectType.AGILE ? '敏捷' : '普通'
}

/** 格式化项目可见范围 */
export function formatProjectOpenStatus(openStatus: boolean) {
  return openStatus ? '公开项目' : '私有项目'
}

/** 格式化项目成员级别 */
export function formatProjectMemberLevel(level: number) {
  return getDictLabel(DICT_TYPE.PMS_PROJECT_MEMBER_LEVEL, level) || '-'
}

/** 格式化项目工作项数量 */
export function formatProjectWorkItemCounts(project: PmsProjectVO) {
  return `${project.completedWorkItemCount}/${project.pendingWorkItemCount}/${project.processingWorkItemCount}`
}

/** 计算项目工作项完成率 */
export function formatProjectCompletionRate(project: PmsProjectVO) {
  const total =
    project.pendingWorkItemCount + project.processingWorkItemCount + project.completedWorkItemCount
  return total > 0 ? Math.round((project.completedWorkItemCount * 100) / total) : 0
}

/** 格式化工时 */
export function formatWorkHours(hours?: number) {
  return hours === undefined ? '--' : `${hours} 小时`
}
