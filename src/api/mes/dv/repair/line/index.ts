import request from '@/config/axios'

// MES 维修工单行 VO
export interface DvRepairLineVO {
  id: number // 编号
  repairId: number // 维修工单编号
  subjectId: number // 项目编号
  subjectName?: string // 项目名称
  subjectContent?: string // 项目内容
  subjectStandard?: string // 项目标准
  malfunction: string // 故障描述
  malfunctionUrl: string // 故障图片 URL
  description: string // 维修描述
  remark: string // 备注
}

// MES 维修工单行 API
export const DvRepairLineApi = {
  // 查询维修工单行分页
  getRepairLinePage: async (params: any) => {
    return await request.get({ url: `/mes/dv/repair-line/page`, params })
  },

  // 查询维修工单行详情
  getRepairLine: async (id: number) => {
    return await request.get({ url: `/mes/dv/repair-line/get?id=` + id })
  },

  // 新增维修工单行
  createRepairLine: async (data: DvRepairLineVO) => {
    return await request.post({ url: `/mes/dv/repair-line/create`, data })
  },

  // 修改维修工单行
  updateRepairLine: async (data: DvRepairLineVO) => {
    return await request.put({ url: `/mes/dv/repair-line/update`, data })
  },

  // 删除维修工单行
  deleteRepairLine: async (id: number) => {
    return await request.delete({ url: `/mes/dv/repair-line/delete?id=` + id })
  }
}
