import request from '@/config/axios'

// PMS 知识库回收站记录 VO
export interface PmsKnowledgeRecycleVO {
  id: number // 回收站记录编号
  libraryId: number // 知识库编号
  type: number // 对象类型
  entityId: number // 对象编号
  name: string // 对象名称
  fileSize?: number // 文件大小，单位：字节
  deleteUserId: number // 删除人用户编号
  deleteUserName?: string // 删除人姓名
  deleteTime: number // 删除时间
  parentId?: number // 父对象编号（详情）
  folderId?: number // 所属文件夹编号（详情）
}

export interface PmsKnowledgeRecycleDetailItemVO {
  id: number
  type: number
  name: string
  parentId?: number
  folderId?: number
  deleteTime?: number
}

export interface PmsKnowledgeRecycleDetailVO {
  root: PmsKnowledgeRecycleVO
  children: PmsKnowledgeRecycleDetailItemVO[]
}

export interface PmsKnowledgeRecyclePreviewVO {
  id: number
  type: number
  name: string
  content?: string
  fileType?: string
  fileSize?: number
}

// 查询知识库回收站列表
export const getKnowledgeLibraryRecycleList = () => {
  return request.get<PmsKnowledgeRecycleVO[]>({ url: '/pms/kb/recycle/library-list' })
}

// 查询知识库内容回收站列表
export const getKnowledgeContentRecycleList = (libraryId: number) => {
  return request.get<PmsKnowledgeRecycleVO[]>({
    url: '/pms/kb/recycle/content-list',
    params: { libraryId }
  })
}

// 查询知识库回收站对象详情及级联内容
export const getKnowledgeContentRecycleDetail = (id: number) => {
  return request.get<PmsKnowledgeRecycleDetailVO>({
    url: '/pms/kb/recycle/content-detail',
    params: { id }
  })
}

// 预览知识库回收站内容
export const getKnowledgeContentRecyclePreview = (id: number, entityId?: number) => {
  return request.get<PmsKnowledgeRecyclePreviewVO>({
    url: '/pms/kb/recycle/content-preview',
    params: { id, entityId }
  })
}

// 恢复回收站记录
export const restoreKnowledgeRecycle = (id: number) => {
  return request.put({ url: '/pms/kb/recycle/restore', params: { id } })
}

// 彻底删除回收站记录
export const permanentDeleteKnowledgeRecycle = (id: number) => {
  return request.delete({ url: '/pms/kb/recycle/permanent-delete', params: { id } })
}
