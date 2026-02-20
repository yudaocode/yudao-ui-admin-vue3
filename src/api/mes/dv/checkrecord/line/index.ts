import request from '@/config/axios'

// MES 设备点检记录明细 VO
export interface DvCheckRecordLineVO {
  id: number // 编号
  recordId: number // 点检记录编号
  subjectId: number // 点检项目编号
  subjectCode?: string // 项目编码
  subjectName?: string // 项目名称
  subjectContent?: string // 检查内容
  subjectStandard?: string // 检查标准
  // TODO @AI：number
  checkStatus: string // 点检结果
  checkResult?: string // 异常描述
  remark: string // 备注
}

// MES 设备点检记录明细 API
export const DvCheckRecordLineApi = {
  // 查询设备点检记录明细分页
  getCheckRecordLinePage: async (params: any) => {
    return await request.get({ url: `/mes/dv/check-record-line/page`, params })
  },

  // 查询设备点检记录明细详情
  getCheckRecordLine: async (id: number) => {
    return await request.get({ url: `/mes/dv/check-record-line/get?id=` + id })
  },

  // 新增设备点检记录明细
  createCheckRecordLine: async (data: DvCheckRecordLineVO) => {
    return await request.post({ url: `/mes/dv/check-record-line/create`, data })
  },

  // 修改设备点检记录明细
  updateCheckRecordLine: async (data: DvCheckRecordLineVO) => {
    return await request.put({ url: `/mes/dv/check-record-line/update`, data })
  },

  // 删除设备点检记录明细
  deleteCheckRecordLine: async (id: number) => {
    return await request.delete({ url: `/mes/dv/check-record-line/delete?id=` + id })
  }
}
