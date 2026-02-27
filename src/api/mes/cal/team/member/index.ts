import request from '@/config/axios'

// MES 班组成员 VO
export interface CalTeamMemberVO {
  id: number
  teamId: number // 班组编号
  userId: number // 用户编号
  userName: string // 用户名称（关联查询）
  nickname: string // 用户昵称（关联查询）
  telephone: string // 用户手机号（关联查询）
  remark: string // 备注
}

// MES 班组成员 API
export const CalTeamMemberApi = {
  // 创建班组成员
  createTeamMember: async (data: CalTeamMemberVO) => {
    return await request.post({ url: `/mes/cal/team-member/create`, data })
  },

  // 删除班组成员
  deleteTeamMember: async (id: number) => {
    return await request.delete({ url: `/mes/cal/team-member/delete?id=` + id })
  },

  // 查询班组成员分页
  getTeamMemberPage: async (params: any) => {
    return await request.get({ url: `/mes/cal/team-member/page`, params })
  },

  // 查询指定班组的成员列表
  getTeamMemberListByTeam: async (teamId: number) => {
    return await request.get({ url: `/mes/cal/team-member/list-by-team`, params: { teamId } })
  },

  // 查询多个班组的成员列表
  getTeamMemberListByTeamIds: async (teamIds: number[]) => {
    return await request.get({ url: `/mes/cal/team-member/list-by-team`, params: { teamIds: teamIds.join(',') } })
  }
}
