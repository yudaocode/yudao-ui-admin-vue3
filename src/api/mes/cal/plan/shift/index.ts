import request from '@/config/axios'

// MES 计划班次 VO
export interface CalPlanShiftVO {
  id: number
  planId: number // 排班计划编号
  sort: number // 显示顺序
  name: string // 班次名称
  startTime: string // 开始时间
  endTime: string // 结束时间
  remark: string // 备注
}

// MES 计划班次 API
export const CalPlanShiftApi = {
  // 查询指定排班计划的班次列表
  getPlanShiftListByPlan: async (planId: number) => {
    return await request.get({ url: `/mes/cal/plan-shift/list-by-plan?planId=` + planId })
  },

  // 新增计划班次
  createPlanShift: async (data: CalPlanShiftVO) => {
    return await request.post({ url: `/mes/cal/plan-shift/create`, data })
  },

  // 修改计划班次
  updatePlanShift: async (data: CalPlanShiftVO) => {
    return await request.put({ url: `/mes/cal/plan-shift/update`, data })
  },

  // 删除计划班次
  deletePlanShift: async (id: number) => {
    return await request.delete({ url: `/mes/cal/plan-shift/delete?id=` + id })
  }
}
