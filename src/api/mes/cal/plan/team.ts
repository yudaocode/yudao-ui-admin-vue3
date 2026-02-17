import request from '@/config/axios'

// MES 计划班组关联 VO
// TODO @AI：挪到 plan/team 目录下
export interface CalPlanTeamVO {
  id: number
  planId: number // 排班计划编号
  teamId: number // 班组编号
  teamCode: string // 班组编码
  teamName: string // 班组名称
  remark: string // 备注
  attribute1: string
  attribute2: string
  attribute3: number
  attribute4: number
}

// MES 计划班组关联 API
export const CalPlanTeamApi = {
  // 查询指定排班计划的班组列表
  getPlanTeamListByPlan: async (planId: number) => {
    return await request.get({ url: `/mes/cal/plan-team/list-by-plan?planId=` + planId })
  },

  // 新增计划班组关联
  createPlanTeam: async (data: CalPlanTeamVO) => {
    return await request.post({ url: `/mes/cal/plan-team/create`, data })
  },

  // 删除计划班组关联
  deletePlanTeam: async (id: number) => {
    return await request.delete({ url: `/mes/cal/plan-team/delete?id=` + id })
  }
}
