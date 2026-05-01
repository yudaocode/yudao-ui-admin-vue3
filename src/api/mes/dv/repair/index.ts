import request from '@/config/axios'

// MES 维修工单 VO
export interface DvRepairVO {
  id: number // 编号
  code: string // 维修工单编码
  name: string // 维修工单名称
  machineryId: number // 设备编号
  machineryCode?: string // 设备编码
  machineryName?: string // 设备名称
  machineryBrand?: string // 品牌
  machinerySpecification?: string // 规格型号
  requireDate: Date // 报修日期
  finishDate: Date // 维修完成日期
  confirmDate: Date // 验收日期
  result: number // 维修结果
  acceptedUserId: number // 维修人用户编号
  acceptedUserNickname?: string // 维修人名称
  confirmUserId: number // 验收人用户编号
  confirmUserNickname?: string // 验收人名称
  sourceDocType: number // 来源单据类型
  sourceDocId: number // 来源单据编号
  sourceDocCode: string // 来源单据编码
  status: number // 状态
  remark: string // 备注
}

// MES 维修工单 API
export const DvRepairApi = {
  // 查询维修工单分页
  getRepairPage: async (params: any) => {
    return await request.get({ url: `/mes/dv/repair/page`, params })
  },

  // 查询维修工单详情
  getRepair: async (id: number) => {
    return await request.get({ url: `/mes/dv/repair/get?id=` + id })
  },

  // 新增维修工单
  createRepair: async (data: DvRepairVO) => {
    return await request.post({ url: `/mes/dv/repair/create`, data })
  },

  // 修改维修工单
  updateRepair: async (data: DvRepairVO) => {
    return await request.put({ url: `/mes/dv/repair/update`, data })
  },

  // 删除维修工单
  deleteRepair: async (id: number) => {
    return await request.delete({ url: `/mes/dv/repair/delete?id=` + id })
  },

  // 导出维修工单 Excel
  exportRepair: async (params: any) => {
    return await request.download({ url: `/mes/dv/repair/export-excel`, params })
  },

  // 提交维修工单（草稿→维修中）
  submitRepair: async (id: number) => {
    return await request.put({ url: `/mes/dv/repair/submit?id=` + id })
  },

  // 确认维修完成（维修中→待验收）
  confirmRepair: async (data: any) => {
    return await request.put({ url: `/mes/dv/repair/confirm`, data })
  },

  // 完成验收（待验收→已确认）
  finishRepair: async (id: number, result: number) => {
    return await request.put({ url: `/mes/dv/repair/finish?id=` + id + `&result=` + result })
  }
}
