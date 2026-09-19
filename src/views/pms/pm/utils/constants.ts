/** PMS 项目分组类型 */
export const PmsProjectGroupType = {
  ALL: 1,
  UNGROUPED: 2,
  CUSTOM: 3
} as const

/** PMS 项目状态 */
export const PmsProjectStatus = {
  ACTIVE: 1,
  ARCHIVED: 2,
  RECYCLED: 3
} as const

/** PMS 项目类型 */
export const PmsProjectType = {
  GENERAL: 1,
  AGILE: 2
} as const

/** PMS 项目优先级 */
export const PmsProjectLevel = {
  NORMAL: 3
} as const

/** PMS 项目列表场景 */
export const PmsProjectSceneType = {
  ALL: 1,
  MANAGED: 2,
  PARTICIPATED: 3
} as const

/** PMS 项目排序类型 */
export const PmsProjectSortType = {
  ACCESS_TIME: 1,
  CREATE_TIME: 2
} as const

/** PMS 项目成员权限级别 */
export const PmsProjectMemberLevel = {
  OWNER: 1,
  ADMIN: 2,
  WRITE: 3,
  READ: 4
} as const

/** PMS 工作台页签 */
export const PmsWorkbenchTab = {
  ALL: 'all',
  REQUIREMENT: 'requirement',
  TASK: 'task',
  DEFECT: 'defect',
  ITERATION: 'iteration'
} as const

/** PMS 工作台页签选项 */
export const PmsWorkbenchTabOptions = [
  { label: '全部事项', value: PmsWorkbenchTab.ALL, countKey: 'allCount' },
  { label: '需求', value: PmsWorkbenchTab.REQUIREMENT, countKey: 'requirementCount' },
  { label: '任务', value: PmsWorkbenchTab.TASK, countKey: 'taskCount' },
  { label: '缺陷', value: PmsWorkbenchTab.DEFECT, countKey: 'defectCount' },
  { label: '迭代', value: PmsWorkbenchTab.ITERATION, countKey: 'iterationCount' }
] as const

/** PMS 项目迭代状态 */
export const PmsIterationStatus = {
  PLANNED: 1,
  ACTIVE: 2,
  COMPLETED: 3
} as const

/** PMS 工作项类型 */
export const PmsWorkItemType = {
  REQUIREMENT: 2,
  TASK: 3,
  DEFECT: 4
} as const

/** PMS 迭代概览统计卡片 */
export const PmsIterationOverviewCardOptions = [{ label: '总事项', field: 'totalCount' }] as const

/** PMS 工作项协作配置选项 */
export const PmsWorkItemConfigurationOptions = [
  {
    type: PmsWorkItemType.REQUIREMENT,
    projectTypes: [PmsProjectType.AGILE],
    description: '配置需求的状态流转和看板分组。'
  },
  {
    type: PmsWorkItemType.TASK,
    projectTypes: [PmsProjectType.GENERAL, PmsProjectType.AGILE],
    description: '配置任务的状态流转和看板分组。'
  },
  {
    type: PmsWorkItemType.DEFECT,
    projectTypes: [PmsProjectType.AGILE],
    description: '配置缺陷的状态流转和看板分组。'
  }
] as const

/** PMS 工作项语义状态 */
export const PmsWorkItemStatusType = {
  PENDING: 1,
  PROCESSING: 2,
  COMPLETED: 3
} as const

/** PMS 工作项生命周期状态 */
export const PmsWorkItemLifecycleStatus = {
  ACTIVE: 1,
  ARCHIVED: 2,
  RECYCLED: 3
} as const

/** PMS 工作项优先级 */
export const PmsWorkItemPriority = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3
} as const

/** PMS 缺陷类型 */
export const PmsWorkItemDefectType = {
  FUNCTION: 1,
  UI: 2,
  USABILITY: 3,
  SECURITY: 4,
  PERFORMANCE: 5,
  CODE: 6
} as const
