import request from '@/config/axios'

// MES 点检保养方案 VO
export interface DvCheckPlanVO {
  id: number // 编号
  code: string // 方案编码
  name: string // 方案名称
  type: number // 方案类型
  startDate: Date // 开始日期
  endDate: Date // 结束日期
  cycleType: number // 周期类型
  cycleCount: number // 周期数量
  status: number // 状态
  remark: string // 备注
}

// MES 点检保养方案 API
export const DvCheckPlanApi = {
  // 查询点检保养方案分页
  getCheckPlanPage: async (params: any) => {
    return await request.get({ url: `/mes/dv/check-plan/page`, params })
  },

  // 查询点检保养方案详情
  getCheckPlan: async (id: number) => {
    return await request.get({ url: `/mes/dv/check-plan/get?id=` + id })
  },

  // 新增点检保养方案
  createCheckPlan: async (data: DvCheckPlanVO) => {
    return await request.post({ url: `/mes/dv/check-plan/create`, data })
  },

  // 修改点检保养方案
  updateCheckPlan: async (data: DvCheckPlanVO) => {
    return await request.put({ url: `/mes/dv/check-plan/update`, data })
  },

  // 启用点检保养方案
  enableCheckPlan: async (id: number) => {
    return await request.put({ url: `/mes/dv/check-plan/enable?id=` + id })
  },

  // 停用点检保养方案
  disableCheckPlan: async (id: number) => {
    return await request.put({ url: `/mes/dv/check-plan/disable?id=` + id })
  },

  // 删除点检保养方案
  deleteCheckPlan: async (id: number) => {
    return await request.delete({ url: `/mes/dv/check-plan/delete?id=` + id })
  },

  // 导出点检保养方案 Excel
  exportCheckPlan: async (params: any) => {
    return await request.download({ url: `/mes/dv/check-plan/export-excel`, params })
  }
}
