import request from '@/config/axios'

// MES 设备点检记录 VO
export interface DvCheckRecordVO {
  id: number // 编号
  planId: number // 点检计划编号
  planName?: string // 计划名称
  machineryId: number // 设备编号
  machineryCode?: string // 设备编码
  machineryName?: string // 设备名称
  machineryBrand?: string // 品牌
  machinerySpec?: string // 规格型号
  checkTime: Date // 点检时间
  userId: number // 点检人编号
  nickname?: string // 点检人名称
  status: number // 状态
  remark: string // 备注
}

// MES 设备点检记录 API
export const DvCheckRecordApi = {
  // 查询设备点检记录分页
  getCheckRecordPage: async (params: any) => {
    return await request.get({ url: `/mes/dv/check-record/page`, params })
  },

  // 查询设备点检记录详情
  getCheckRecord: async (id: number) => {
    return await request.get({ url: `/mes/dv/check-record/get?id=` + id })
  },

  // 新增设备点检记录
  createCheckRecord: async (data: DvCheckRecordVO) => {
    return await request.post({ url: `/mes/dv/check-record/create`, data })
  },

  // 修改设备点检记录
  updateCheckRecord: async (data: DvCheckRecordVO) => {
    return await request.put({ url: `/mes/dv/check-record/update`, data })
  },

  // 提交设备点检记录
  submitCheckRecord: async (id: number) => {
    return await request.put({ url: `/mes/dv/check-record/submit?id=` + id })
  },

  // 删除设备点检记录
  deleteCheckRecord: async (id: number) => {
    return await request.delete({ url: `/mes/dv/check-record/delete?id=` + id })
  },

  // 导出设备点检记录 Excel
  exportCheckRecord: async (params: any) => {
    return await request.download({ url: `/mes/dv/check-record/export-excel`, params })
  }
}
