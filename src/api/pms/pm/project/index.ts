import request from '@/config/axios'

// PMS 项目 VO
export interface PmsProjectVO {
  id: number // 项目编号
  name: string // 项目名称
  status: number // 项目状态
  type: number // 项目类型
  level: number // 项目优先级
  description?: string // 项目描述
  openStatus: boolean // 是否公开
  icon: string // 项目图标
  startTime?: number | string // 开始时间
  endTime?: number | string // 截止时间
  memberUserIds?: number[] // 初始成员编号列表
  archiveTime?: number // 归档时间
  recycleTime?: number // 移入回收站时间
  accessTime?: number // 最近访问时间
  createTime: number // 创建时间
  creator?: string // 创建人编号
  creatorName?: string // 创建人姓名
  adminNames: string[] // 项目管理员姓名列表
  memberCount: number // 项目成员数量
  pendingWorkItemCount: number // 未开始工作项数量
  processingWorkItemCount: number // 进行中工作项数量
  completedWorkItemCount: number // 已完成工作项数量
  ownerStatus: boolean // 当前用户是否拥有项目所有者权限
  adminStatus: boolean // 当前用户是否为项目管理员
  memberStatus: boolean // 当前用户是否为项目成员
  exitStatus: boolean // 当前用户是否可以主动退出项目
  writeStatus: boolean // 当前用户是否可以编辑项目业务数据
  favoriteStatus: boolean // 当前用户是否已收藏
  completedTrends?: Array<{ date: string; count: number }> // 近十四日完成工作项趋势
}

// PMS 项目概况 VO
export interface PmsProjectOverviewVO {
  totalCount: number // 工作项总数
  pendingCount: number // 未开始工作项数量
  processingCount: number // 进行中工作项数量
  completedCount: number // 已完成工作项数量
  typeCountMap: Record<number, number> // 按工作项类型统计
  completedTrends: Array<{ date: string; count: number }> // 近十四日完成趋势
  assignedWorkItems: Array<{
    // 分配给当前用户的未完成工作项
    id: number // 工作项编号
    serialNumber: number // 项目内序号
    type: number // 工作项类型
    name: string // 工作项标题
    status: number // 语义状态
    endTime?: number // 截止时间
    progress: number // 完成进度
  }>
}

// 查询项目分页
export const getProjectPage = (params: PageParam) => {
  return request.get<PageResult<PmsProjectVO[]>>({ url: '/pms/pm/project/page', params })
}

// 查询星标项目列表
export const getFavoriteProjectList = () => {
  return request.get<PmsProjectVO[]>({ url: '/pms/pm/project/favorite-list' })
}

// 查询项目详情
export const getProject = (id: number) => {
  return request.get<PmsProjectVO>({ url: '/pms/pm/project/get', params: { id } })
}

// 新增项目
export const createProject = (data: Partial<PmsProjectVO>) => {
  return request.post({ url: '/pms/pm/project/create', data })
}

// 修改项目
export const updateProject = (data: Partial<PmsProjectVO>) => {
  return request.put({ url: '/pms/pm/project/update', data })
}

// 归档项目
export const archiveProject = (id: number) => {
  return request.put({ url: '/pms/pm/project/archive', params: { id } })
}

// 将项目移入回收站
export const recycleProject = (id: number) => {
  return request.put({ url: '/pms/pm/project/recycle', params: { id } })
}

// 恢复回收站项目
export const restoreProject = (id: number) => {
  return request.put({ url: '/pms/pm/project/restore', params: { id } })
}

// 彻底删除回收站项目
export const deleteProject = (id: number) => {
  return request.delete({ url: '/pms/pm/project/delete', params: { id } })
}

// 查询项目概览
export const getProjectOverview = (projectId: number) => {
  return request.get<PmsProjectOverviewVO>({
    url: '/pms/pm/project/overview',
    params: { projectId }
  })
}
