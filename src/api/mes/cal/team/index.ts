import request from '@/config/axios'

// MES 班组 VO
export interface CalTeamVO {
  id: number
  code: string // 班组编码
  name: string // 班组名称
  calendarType: number // 班组类型
  remark: string // 备注
}

// MES 班组 API
export const CalTeamApi = {
  // 查询班组分页
  getTeamPage: async (params: any) => {
    return await request.get({ url: `/mes/cal/team/page`, params })
  },

  // 查询班组详情
  getTeam: async (id: number) => {
    return await request.get({ url: `/mes/cal/team/get?id=` + id })
  },

  // 新增班组
  createTeam: async (data: CalTeamVO) => {
    return await request.post({ url: `/mes/cal/team/create`, data })
  },

  // 修改班组
  updateTeam: async (data: CalTeamVO) => {
    return await request.put({ url: `/mes/cal/team/update`, data })
  },

  // 删除班组
  deleteTeam: async (id: number) => {
    return await request.delete({ url: `/mes/cal/team/delete?id=` + id })
  },

  // 获得班组列表（全量，用于下拉选择）
  getTeamList: async () => {
    return await request.get({ url: `/mes/cal/team/list` })
  },

  // 导出班组 Excel
  exportTeam: async (params: any) => {
    return await request.download({ url: `/mes/cal/team/export-excel`, params })
  }
}
