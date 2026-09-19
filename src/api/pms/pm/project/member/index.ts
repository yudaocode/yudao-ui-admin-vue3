import request from '@/config/axios'

// PMS 项目成员 VO
export interface PmsProjectMemberVO {
  userId: number // 后台用户编号
  nickname: string // 用户昵称
  avatar?: string // 用户头像
  level: number // 成员权限级别
  creatorStatus: boolean // 是否项目创建人
}

// PMS 项目成员项 VO
export interface PmsProjectMemberItemReqVO {
  userId: number // 后台用户编号
  level: number // 成员权限级别
}

// 查询项目成员列表
export const getProjectMemberList = (projectId: number) => {
  return request.get<PmsProjectMemberVO[]>({
    url: '/pms/pm/project-member/list',
    params: { projectId }
  })
}

// 修改项目成员列表
export const updateProjectMemberList = (
  projectId: number,
  members: PmsProjectMemberItemReqVO[]
) => {
  return request.put({
    url: '/pms/pm/project-member/update-list',
    data: { projectId, members }
  })
}

// 删除项目成员
export const deleteProjectMember = (projectId: number, userId: number) => {
  return request.delete({
    url: '/pms/pm/project-member/delete',
    params: { projectId, userId }
  })
}

// 退出项目
export const exitProject = (projectId: number) => {
  return request.delete({ url: '/pms/pm/project-member/exit', params: { projectId } })
}
