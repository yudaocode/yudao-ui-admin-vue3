import request from '@/config/axios'

// MES 设备保养记录明细 VO
export interface DvMaintenRecordLineVO {
  id: number // 编号
  recordId: number // 保养记录编号
  subjectId: number // 项目编号
  subjectName?: string // 项目名称
  subjectContent?: string // 项目内容
  subjectStandard?: string // 项目标准
  status: number // 保养结果
  result: string // 异常描述
  remark: string // 备注
}

// MES 设备保养记录明细 API
export const DvMaintenRecordLineApi = {
  // 查询设备保养记录明细分页
  getMaintenRecordLinePage: async (params: any) => {
    return await request.get({ url: `/mes/dv/mainten-record-line/page`, params })
  },

  // 查询设备保养记录明细详情
  getMaintenRecordLine: async (id: number) => {
    return await request.get({ url: `/mes/dv/mainten-record-line/get?id=` + id })
  },

  // 新增设备保养记录明细
  createMaintenRecordLine: async (data: DvMaintenRecordLineVO) => {
    return await request.post({ url: `/mes/dv/mainten-record-line/create`, data })
  },

  // 修改设备保养记录明细
  updateMaintenRecordLine: async (data: DvMaintenRecordLineVO) => {
    return await request.put({ url: `/mes/dv/mainten-record-line/update`, data })
  },

  // 删除设备保养记录明细
  deleteMaintenRecordLine: async (id: number) => {
    return await request.delete({ url: `/mes/dv/mainten-record-line/delete?id=` + id })
  }
}
