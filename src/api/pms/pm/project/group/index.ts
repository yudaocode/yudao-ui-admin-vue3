import request from '@/config/axios'

// PMS 项目分组 VO
export interface PmsProjectGroupVO {
  id?: number // 项目分组编号
  name: string // 分组名称
  sort?: number // 显示顺序
  type?: number // 分组类型
  projectCount?: number // 项目数量
  createTime?: number // 创建时间
}

// PMS 项目分组排序项 VO
export interface PmsProjectGroupSortItemReqVO {
  id: number // 项目分组编号
  sort: number // 显示顺序
}

// PMS 项目移动分组 VO
export interface PmsProjectGroupMoveReqVO {
  projectId: number // 项目编号
  groupId?: number // 目标项目分组编号；不传表示移动到未分组
}

// 查询当前用户的项目分组列表
export const getProjectGroupList = () => {
  return request.get<PmsProjectGroupVO[]>({ url: '/pms/pm/project-group/list' })
}

// 新增项目分组
export const createProjectGroup = (data: PmsProjectGroupVO) => {
  return request.post<number>({ url: '/pms/pm/project-group/create', data })
}

// 修改项目分组
export const updateProjectGroup = (data: PmsProjectGroupVO) => {
  return request.put<boolean>({ url: '/pms/pm/project-group/update', data })
}

// 修改项目分组排序
export const updateProjectGroupSort = (items: PmsProjectGroupSortItemReqVO[]) => {
  return request.put<boolean>({ url: '/pms/pm/project-group/update-sort', data: { items } })
}

// 删除项目分组
export const deleteProjectGroup = (id: number) => {
  return request.delete<boolean>({ url: '/pms/pm/project-group/delete', params: { id } })
}

// 移动项目到个人分组
export const moveProjectToGroup = (data: PmsProjectGroupMoveReqVO) => {
  return request.put<boolean>({ url: '/pms/pm/project-group/move-project', data })
}
