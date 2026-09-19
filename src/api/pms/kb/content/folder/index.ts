import request from '@/config/axios'
import type { PmsKnowledgeDocumentTreeNode } from '../document'

// PMS 知识库文件夹 VO
export interface PmsKnowledgeFolderVO {
  id: number // 文件夹编号
  libraryId: number // 知识库编号
  permissionId: number // 协作权限编号
  currentUserLevel: number // 当前用户协作等级
  parentId: number // 父文件夹编号
  title: string // 文件夹标题
  childFolderCount: number // 直属子文件夹数量
  documentCount: number // 直属文档数量
  status: number // 状态
  favoriteStatus: boolean // 当前用户是否已关注
  createTime: number // 创建时间
  updateTime: number // 更新时间
}

// PMS 知识库文件夹移动 VO
export interface PmsKnowledgeFolderMoveReqVO {
  id: number // 文件夹编号
  targetLibraryId: number // 目标知识库编号
  targetParentId: number // 目标父文件夹编号，0 表示根目录
}

// PMS 知识库文件夹树节点 VO
export interface PmsKnowledgeFolderTreeNode {
  id: number // 文件夹编号
  permissionId: number // 协作权限编号
  currentUserLevel: number // 当前用户协作等级
  parentId: number // 父文件夹编号
  title: string // 文件夹标题
  children: PmsKnowledgeFolderTreeNode[] // 子文件夹列表
  documents: PmsKnowledgeDocumentTreeNode[] // 文件夹下的文档列表
}

// PMS 知识库目录树 VO
export interface PmsKnowledgeTreeVO {
  libraryId: number // 知识库编号
  writeStatus: boolean // 当前用户是否可编辑
  manageStatus: boolean // 当前用户是否可管理目录结构
  folders: PmsKnowledgeFolderTreeNode[] // 根文件夹列表
  documents: PmsKnowledgeDocumentTreeNode[] // 根文档列表
}

// 查询知识库目录树
export const getKnowledgeTree = (libraryId: number) => {
  return request.get<PmsKnowledgeTreeVO>({ url: '/pms/kb/folder/tree', params: { libraryId } })
}

// 查询知识库文件夹详情
export const getKnowledgeFolder = (id: number, view = false) => {
  return request.get<PmsKnowledgeFolderVO>({ url: '/pms/kb/folder/get', params: { id, view } })
}

// 新增知识库文件夹
export const createKnowledgeFolder = (data: PmsKnowledgeFolderVO) => {
  return request.post({ url: '/pms/kb/folder/create', data })
}

// 修改知识库文件夹
export const updateKnowledgeFolder = (data: PmsKnowledgeFolderVO) => {
  return request.put({ url: '/pms/kb/folder/update', data })
}

// 删除知识库文件夹
export const deleteKnowledgeFolder = (id: number) => {
  return request.delete({ url: '/pms/kb/folder/delete', params: { id } })
}

// 移动知识库文件夹
export const moveKnowledgeFolder = (data: PmsKnowledgeFolderMoveReqVO) => {
  return request.put({ url: '/pms/kb/folder/move', data })
}
