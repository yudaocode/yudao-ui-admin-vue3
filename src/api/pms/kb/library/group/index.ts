import request from '@/config/axios'

// PMS 知识库分组 VO
export interface PmsKnowledgeGroupVO {
  id: number // 知识库分组编号
  name: string // 分组名称
  sort: number // 显示顺序
  type: number // 分组类型
  libraryCount?: number // 分组内知识库数量（列表返回）
  createTime?: number // 创建时间
}

// PMS 知识库分组排序项 VO
export interface PmsKnowledgeGroupSortItemReqVO {
  id: number // 知识库分组编号
  sort: number // 显示顺序
}

// 查询当前用户的知识库分组列表
export const getKnowledgeGroupList = () => {
  return request.get<PmsKnowledgeGroupVO[]>({ url: '/pms/kb/group/list' })
}

// 查询知识库分组详情
export const getKnowledgeGroup = (id: number) => {
  return request.get<PmsKnowledgeGroupVO>({ url: '/pms/kb/group/get', params: { id } })
}

// 新增知识库分组
export const createKnowledgeGroup = (data: PmsKnowledgeGroupVO) => {
  return request.post({ url: '/pms/kb/group/create', data })
}

// 修改知识库分组
export const updateKnowledgeGroup = (data: PmsKnowledgeGroupVO) => {
  return request.put({ url: '/pms/kb/group/update', data })
}

// 修改知识库分组排序
export const updateKnowledgeGroupSort = (items: PmsKnowledgeGroupSortItemReqVO[]) => {
  return request.put({ url: '/pms/kb/group/update-sort', data: { items } })
}

// 删除知识库分组
export const deleteKnowledgeGroup = (id: number) => {
  return request.delete({ url: '/pms/kb/group/delete', params: { id } })
}

// 移动知识库到个人分组
export const moveKnowledgeLibraryToGroup = (libraryId: number, groupId?: number) => {
  return request.put({ url: '/pms/kb/group/move', data: { libraryId, groupId } })
}
