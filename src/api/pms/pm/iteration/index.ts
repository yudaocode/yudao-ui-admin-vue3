import request from '@/config/axios'

// PMS 项目迭代 VO
export interface PmsIterationVO {
  id?: number // 迭代编号
  projectId: number // 项目编号
  name: string // 迭代名称
  ownerUserId?: number // 负责人用户编号
  ownerUserName?: string // 负责人姓名
  status?: number // 迭代状态
  startTime?: number | string // 开始时间
  endTime?: number | string // 结束时间
  finishTime?: number // 完成时间
  target?: string // 迭代目标
  description?: string // 迭代描述
  sort?: number // 显示顺序
  progress?: number // 完成进度百分比
  createTime?: number // 创建时间
}

// PMS 项目迭代开始 VO
export interface PmsIterationStartReqVO {
  id: number // 迭代编号
  startTime: number // 开始时间
  endTime: number // 结束时间
}

// PMS 迭代概览 VO
export interface PmsIterationOverviewVO {
  totalCount: number // 工作项总数
  pendingCount: number // 未开始工作项数量
  processingCount: number // 进行中工作项数量
  completedCount: number // 已完成工作项数量
  progress: number // 完成进度百分比
  typeCountMap: Record<number, number> // 工作项类型数量统计
  typeStatusCountMap: Record<number, Record<number, number>> // 工作项类型和状态数量统计
  statusTrends: Array<{
    date: string
    pendingCount: number
    processingCount: number
    completedCount: number
  }> // 状态趋势
  burnDowns: Array<{ date: string; idealRemaining: number; actualRemaining: number }> // 燃尽图数据（单位：小时）
  recentActivities: Array<{
    // 最近动态列表
    id: number // 动态编号
    workItemId: number // 工作项编号
    workItemSerialNumber: number // 工作项序号
    workItemName: string // 工作项名称
    operatorUserId: number // 操作人编号
    operatorUserName?: string // 操作人昵称
    content: string // 动态内容
    createTime: number // 创建时间
  }>
}

// 查询迭代分页
export const getIterationPage = (params: PageParam) => {
  return request.get<PageResult<PmsIterationVO[]>>({ url: '/pms/pm/iteration/page', params })
}

// 查询迭代详情
export const getIteration = (id: number) => {
  return request.get<PmsIterationVO>({ url: '/pms/pm/iteration/get', params: { id } })
}

// 查询迭代概览
export const getIterationOverview = (id: number) => {
  return request.get<PmsIterationOverviewVO>({
    url: '/pms/pm/iteration/overview',
    params: { id }
  })
}

// 新增迭代
export const createIteration = (data: PmsIterationVO) => {
  return request.post({ url: '/pms/pm/iteration/create', data })
}

// 修改迭代
export const updateIteration = (data: PmsIterationVO) => {
  return request.put({ url: '/pms/pm/iteration/update', data })
}

// 开始迭代
export const startIteration = (data: PmsIterationStartReqVO) => {
  return request.put({ url: '/pms/pm/iteration/start', data })
}

// 完成迭代
export const completeIteration = (id: number) => {
  return request.put({ url: '/pms/pm/iteration/complete', params: { id } })
}

// 删除迭代
export const deleteIteration = (id: number) => {
  return request.delete({ url: '/pms/pm/iteration/delete', params: { id } })
}
