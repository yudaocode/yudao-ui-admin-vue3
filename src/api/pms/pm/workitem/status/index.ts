import request from '@/config/axios'

// PMS 工作项看板状态 VO
export interface PmsWorkItemStatusVO {
  id: number // 状态编号
  projectId: number // 项目编号
  workItemType: number // 工作项类型
  name: string // 状态名称
  statusType: number // 语义状态
  description?: string // 状态描述
  boardName?: string // 看板列名称，为空时不在看板展示
  defaultStatus: boolean // 是否初始状态
  sort: number // 显示顺序
}

export interface PmsWorkItemBoardVO {
  id?: number // 看板列编号
  name: string // 看板列名称
  statusIds: number[] // 关联状态编号列表
}

export interface PmsWorkItemBoardConfigVO {
  boards: PmsWorkItemBoardVO[] // 看板列列表
  unassignedStatusIds: number[] // 未放入看板的状态编号列表
}

// 查询工作项状态详情
export const getWorkItemStatus = (id: number) => {
  return request.get<PmsWorkItemStatusVO>({
    url: '/pms/pm/work-item-status/get',
    params: { id }
  })
}

// 查询工作项状态列表
export const getWorkItemStatusList = (projectId: number, type: number) => {
  return request.get<PmsWorkItemStatusVO[]>({
    url: '/pms/pm/work-item-status/list',
    params: { projectId, type }
  })
}

// 新增工作项状态
export const createWorkItemStatus = (data: PmsWorkItemStatusVO) => {
  return request.post({ url: '/pms/pm/work-item-status/create', data })
}

// 修改工作项状态配置
export const updateWorkItemStatusConfig = (data: PmsWorkItemStatusVO) => {
  return request.put({ url: '/pms/pm/work-item-status/update', data })
}

// 修改默认工作项状态
export const updateDefaultWorkItemStatus = (id: number) => {
  return request.put({ url: '/pms/pm/work-item-status/update-default', params: { id } })
}

// 修改工作项状态顺序
export const updateWorkItemStatusSort = (statusIds: number[]) => {
  return request.put({ url: '/pms/pm/work-item-status/update-sort', data: { statusIds } })
}

// 查询工作项看板配置
export const getWorkItemBoardConfig = (projectId: number, type: number) => {
  return request.get<PmsWorkItemBoardConfigVO>({
    url: '/pms/pm/work-item-status/get-board-config',
    params: { projectId, type }
  })
}

// 修改工作项看板配置
export const updateWorkItemBoardConfig = (
  projectId: number,
  workItemType: number,
  boards: PmsWorkItemBoardVO[]
) => {
  return request.put({
    url: '/pms/pm/work-item-status/update-board-config',
    data: { projectId, workItemType, boards }
  })
}

// 删除工作项状态
export const deleteWorkItemStatus = (id: number, transferStatusId?: number) => {
  return request.delete({
    url: '/pms/pm/work-item-status/delete',
    data: { id, transferStatusId }
  })
}
