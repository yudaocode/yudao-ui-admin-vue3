import request from '@/config/axios'

// TODO @AI：放到 machinery/index.ts
// MES 点检保养方案设备 VO
export interface DvCheckPlanMachineryVO {
  id: number
  planId: number // 方案编号
  machineryId: number // 设备编号
  machineryCode: string // 设备编码
  machineryName: string // 设备名称
  machineryBrand: string // 品牌
  machinerySpec: string // 规格型号
  remark: string // 备注
}

// MES 点检保养方案设备 API
export const DvCheckPlanMachineryApi = {
  // 查询指定方案的设备列表
  getListByPlan: async (planId: number) => {
    return await request.get({ url: `/mes/dv/check-plan-machinery/list-by-plan?planId=` + planId })
  },

  // 新增方案设备关联
  create: async (data: DvCheckPlanMachineryVO) => {
    return await request.post({ url: `/mes/dv/check-plan-machinery/create`, data })
  },

  // 删除方案设备关联
  delete: async (id: number) => {
    return await request.delete({ url: `/mes/dv/check-plan-machinery/delete?id=` + id })
  }
}
