import request from '@/config/axios'

// MES 设备保养记录 VO
export interface DvMaintenRecordVO {
  id: number // 编号
  planId: number // 计划编号
  planName?: string // 计划名称
  machineryId: number // 设备编号
  machineryCode?: string // 设备编码
  machineryName?: string // 设备名称
  machineryBrand?: string // 品牌
  machinerySpec?: string // 规格型号
  maintenTime: Date // 保养时间
  userId: number // 用户编号
  nickname?: string // 保养人名称
  status: number // 状态
  remark: string // 备注
}

// MES 设备保养记录 API
export const DvMaintenRecordApi = {
  // 查询设备保养记录分页
  getMaintenRecordPage: async (params: any) => {
    return await request.get({ url: `/mes/dv/mainten-record/page`, params })
  },

  // 查询设备保养记录详情
  getMaintenRecord: async (id: number) => {
    return await request.get({ url: `/mes/dv/mainten-record/get?id=` + id })
  },

  // 新增设备保养记录
  createMaintenRecord: async (data: DvMaintenRecordVO) => {
    return await request.post({ url: `/mes/dv/mainten-record/create`, data })
  },

  // 修改设备保养记录
  updateMaintenRecord: async (data: DvMaintenRecordVO) => {
    return await request.put({ url: `/mes/dv/mainten-record/update`, data })
  },

  // 提交设备保养记录
  submitMaintenRecord: async (id: number) => {
    return await request.put({ url: `/mes/dv/mainten-record/submit?id=` + id })
  },

  // 删除设备保养记录
  deleteMaintenRecord: async (id: number) => {
    return await request.delete({ url: `/mes/dv/mainten-record/delete?id=` + id })
  },

  // 导出设备保养记录 Excel
  exportMaintenRecord: async (params: any) => {
    return await request.download({ url: `/mes/dv/mainten-record/export-excel`, params })
  }
}
