import request from '@/config/axios'

// TODO @AI：挪到 plan/shift 目录下

// MES 计划班次 VO
export interface CalShiftVO {
  id: number
  planId: number // 排班计划编号
  sort: number // 显示顺序
  name: string // 班次名称
  startTime: string // 开始时间
  endTime: string // 结束时间
  remark: string // 备注
  attribute1: string
  attribute2: string
  attribute3: number
  attribute4: number
}

// MES 计划班次 API
export const CalShiftApi = {
  // 查询计划班次分页
  getShiftPage: async (params: any) => {
    return await request.get({ url: `/mes/cal/shift/page`, params })
  },

  // 查询计划班次详情
  getShift: async (id: number) => {
    return await request.get({ url: `/mes/cal/shift/get?id=` + id })
  },

  // 查询指定排班计划的班次列表
  getShiftListByPlan: async (planId: number) => {
    return await request.get({ url: `/mes/cal/shift/list-by-plan?planId=` + planId })
  },

  // 新增计划班次
  createShift: async (data: CalShiftVO) => {
    return await request.post({ url: `/mes/cal/shift/create`, data })
  },

  // 修改计划班次
  updateShift: async (data: CalShiftVO) => {
    return await request.put({ url: `/mes/cal/shift/update`, data })
  },

  // 删除计划班次
  deleteShift: async (id: number) => {
    return await request.delete({ url: `/mes/cal/shift/delete?id=` + id })
  },

  // 导出计划班次 Excel
  exportShift: async (params: any) => {
    return await request.download({ url: `/mes/cal/shift/export-excel`, params })
  }
}
