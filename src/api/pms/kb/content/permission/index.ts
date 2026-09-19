import request from '@/config/axios'

// PMS 知识内容协作者 VO
export interface PmsKnowledgeContentPermissionMemberVO {
  id?: number // 协作者编号
  userId?: number // 用户编号
  userName?: string // 用户昵称
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  level: number // 协作等级
}

// PMS 知识内容协作权限 VO
export interface PmsKnowledgeContentPermissionVO {
  id: number // 协作权限编号
  libraryId: number // 知识库编号
  openStatus: boolean // 是否公开
  openLevel: number // 公开协作等级
  creatorUserId: number // 创建人用户编号
  currentUserLevel: number // 当前用户协作等级
  members: PmsKnowledgeContentPermissionMemberVO[] // 协作者列表
}

// 查询知识内容协作权限
export const getKnowledgeContentPermission = (id: number) => {
  return request.get<PmsKnowledgeContentPermissionVO>({
    url: '/pms/kb/content-permission/get',
    params: { id }
  })
}

// 修改知识内容协作权限
export const updateKnowledgeContentPermission = (data: PmsKnowledgeContentPermissionVO) => {
  return request.put({ url: '/pms/kb/content-permission/update', data })
}
