import request from '@/config/axios'

// MES 安灯记录 VO
export interface ProAndonRecordVO {
  id: number // 编号
  configId: number // 安灯配置编号
  workstationId: number // 工作站编号
  workstationCode: string // 工作站编码
  workstationName: string // 工作站名称
  userId: number // 发起用户编号
  userNickname: string // 发起人昵称
  workOrderId: number // 工单编号
  workOrderCode: string // 工单编码
  processId: number // 工序编号
  processName: string // 工序名称
  reason: string // 呼叫原因
  level: number // 级别
  status: number // 处置状态
  handleTime: Date // 处置时间
  handlerUserId: number // 处置人编号
  handlerUserNickname: string // 处置人昵称
  remark: string // 备注
  createTime: Date // 发起时间
}

// MES 安灯记录 API
export const ProAndonRecordApi = {
  // 查询安灯记录分页
  getAndonRecordPage: async (params: any) => {
    return await request.get({ url: `/mes/pro/andon-record/page`, params })
  },

  // 查询安灯记录详情
  getAndonRecord: async (id: number) => {
    return await request.get({ url: `/mes/pro/andon-record/get?id=` + id })
  },

  // 新增安灯记录
  createAndonRecord: async (data: ProAndonRecordVO) => {
    return await request.post({ url: `/mes/pro/andon-record/create`, data })
  },

  // 删除安灯记录
  deleteAndonRecord: async (id: number) => {
    return await request.delete({ url: `/mes/pro/andon-record/delete?id=` + id })
  },

  // 更新安灯记录（保存/已处置）
  updateAndonRecord: async (data: any) => {
    return await request.put({ url: `/mes/pro/andon-record/update`, data })
  },

  // 导出安灯记录 Excel
  exportAndonRecord: async (params: any) => {
    return await request.download({ url: `/mes/pro/andon-record/export-excel`, params })
  }
}
