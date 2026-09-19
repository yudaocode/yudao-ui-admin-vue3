import request from '@/config/axios'

// PMS 工作台数量 VO
export interface PmsWorkbenchCountVO {
  requirementCount: number // 需求数量
  taskCount: number // 任务数量
  defectCount: number // 缺陷数量
  iterationCount: number // 迭代数量
}

// PMS 工作台工作项 VO
export interface PmsWorkbenchWorkItemVO {
  id: number // 工作项编号
  projectId: number // 项目编号
  projectName: string // 项目名称
  projectType: number // 项目类型
  type: number // 工作项类型
  serialNumber: number // 工作项序号
  name: string // 工作项名称
  priority: number // 优先级
  assigneeUserId?: number // 负责人用户编号
  assigneeUserName?: string // 负责人姓名
  creatorUserId: number // 创建人用户编号
  creatorUserName?: string // 创建人姓名
  statusId: number // 状态编号
  statusName: string // 状态名称
  status: number // 语义状态
  progress: number // 进度
  startTime?: number // 开始时间
  endTime?: number // 结束时间
  writeStatus: boolean // 是否可编辑
  createTime: number // 创建时间
}

// PMS 工作台迭代 VO
export interface PmsWorkbenchIterationVO {
  id: number // 迭代编号
  projectId: number // 项目编号
  projectName: string // 项目名称
  projectType: number // 项目类型
  name: string // 迭代名称
  status: number // 迭代状态
  startTime?: number // 开始时间
  endTime?: number // 结束时间
  target?: string // 迭代目标
}

// 查询工作台待办统计
export const getWorkbenchCount = (params: PageParam) => {
  return request.get<PmsWorkbenchCountVO>({
    url: '/pms/pm/workbench/count',
    params
  })
}

// 查询工作台工作项分页
export const getWorkbenchWorkItemPage = (params: PageParam) => {
  return request.get<PageResult<PmsWorkbenchWorkItemVO[]>>({
    url: '/pms/pm/workbench/work-item-page',
    params
  })
}

// 查询工作台迭代分页
export const getWorkbenchIterationPage = (params: PageParam) => {
  return request.get<PageResult<PmsWorkbenchIterationVO[]>>({
    url: '/pms/pm/workbench/iteration-page',
    params
  })
}
