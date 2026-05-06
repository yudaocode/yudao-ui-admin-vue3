import request from '@/config/axios'

// MES 排班计划 VO
export interface CalPlanVO {
  id: number
  code: string // 计划编码
  name: string // 计划名称
  calendarType: number // 班组类型
  startDate: number // 开始日期
  endDate: number // 结束日期
  shiftType: number // 轮班方式
  shiftMethod: number // 倒班方式
  shiftCount: number // 倒班天数
  status: number // 状态
  remark: string // 备注
}

// MES 排班计划 API
export const CalPlanApi = {
  // 查询排班计划分页
  getPlanPage: async (params: any) => {
    return await request.get({ url: `/mes/cal/plan/page`, params })
  },

  // 查询排班计划详情
  getPlan: async (id: number) => {
    return await request.get({ url: `/mes/cal/plan/get?id=` + id })
  },

  // 新增排班计划
  createPlan: async (data: CalPlanVO) => {
    return await request.post({ url: `/mes/cal/plan/create`, data })
  },

  // 修改排班计划
  updatePlan: async (data: CalPlanVO) => {
    return await request.put({ url: `/mes/cal/plan/update`, data })
  },

  // 确认排班计划
  confirmPlan: async (id: number) => {
    return await request.put({ url: `/mes/cal/plan/confirm?id=` + id })
  },

  // 删除排班计划
  deletePlan: async (id: number) => {
    return await request.delete({ url: `/mes/cal/plan/delete?id=` + id })
  },

  // 导出排班计划 Excel
  exportPlan: async (params: any) => {
    return await request.download({ url: `/mes/cal/plan/export-excel`, params })
  }
}
