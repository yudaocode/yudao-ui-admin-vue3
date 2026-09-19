import request from '@/config/axios'

// PMS 知识库成员 VO
export interface PmsKnowledgeLibraryMemberVO {
  id: number // 成员编号
  userId?: number // 用户编号
  nickname?: string // 用户姓名
  avatar?: string // 用户头像
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  parentDeptId?: number // 父部门编号
  parentDeptName?: string // 父部门名称
  level: number // 成员等级
}

// PMS 知识库成员列表修改 VO
export interface PmsKnowledgeLibraryMemberUpdateReqVO {
  libraryId: number // 知识库编号
  members: Array<{ userId?: number; deptId?: number; level: number }> // 成员列表
}

// 查询知识库成员列表
export const getKnowledgeLibraryMemberList = (libraryId: number) => {
  return request.get<PmsKnowledgeLibraryMemberVO[]>({
    url: '/pms/kb/library-member/list',
    params: { libraryId }
  })
}

// 修改知识库成员列表
export const updateKnowledgeLibraryMemberList = (data: PmsKnowledgeLibraryMemberUpdateReqVO) => {
  return request.put({ url: '/pms/kb/library-member/update-list', data })
}

// 退出知识库
export const exitKnowledgeLibrary = (libraryId: number) => {
  return request.delete({ url: '/pms/kb/library-member/exit', params: { libraryId } })
}
