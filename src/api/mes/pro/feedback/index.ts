import request from '@/config/axios'

// MES 生产报工 VO
export interface ProFeedbackVO {
  id: number // 编号
  code: string // 报工单编号
  type: number // 报工类型
  channel: string // 报工途径
  feedbackTime: Date // 报工时间
  workstationId: number // 工作站编号
  workstationCode: string // 工作站编码
  workstationName: string // 工作站名称
  routeId: number // 工艺路线编号
  routeCode: string // 工艺路线编码
  processId: number // 工序编号
  processCode: string // 工序编码
  processName: string // 工序名称
  checkFlag: boolean // 是否需要检验
  workOrderId: number // 生产工单编号
  workOrderCode: string // 工单编码
  workOrderName: string // 工单名称
  taskId: number // 生产任务编号
  taskCode: string // 任务编码
  itemId: number // 产品物料编号
  itemCode: string // 物料编码
  itemName: string // 物料名称
  itemSpec: string // 规格型号
  unitMeasureId: number // 单位编号
  unitMeasureName: string // 单位名称
  expireDate: Date // 过期日期
  scheduledQuantity: number // 排产数量
  feedbackQuantity: number // 本次报工数量
  qualifiedQuantity: number // 合格品数量
  unqualifiedQuantity: number // 不良品数量
  uncheckQuantity: number // 待检测数量
  laborScrapQuantity: number // 工废数量
  materialScrapQuantity: number // 料废数量
  otherScrapQuantity: number // 其他废品数量
  feedbackUserId: number // 报工用户编号
  feedbackUserNickname: string // 报工人昵称
  approveUserId: number // 审核用户编号
  approveUserNickname: string // 审核人昵称
  status: number // 状态
  remark: string // 备注
}

// MES 生产报工 API
export const ProFeedbackApi = {
  // 查询生产报工分页
  getFeedbackPage: async (params: any) => {
    return await request.get({ url: `/mes/pro/feedback/page`, params })
  },
  // 查询生产报工详情
  getFeedback: async (id: number) => {
    return await request.get({ url: `/mes/pro/feedback/get?id=` + id })
  },
  // 新增生产报工
  createFeedback: async (data: ProFeedbackVO) => {
    return await request.post({ url: `/mes/pro/feedback/create`, data })
  },
  // 修改生产报工
  updateFeedback: async (data: ProFeedbackVO) => {
    return await request.put({ url: `/mes/pro/feedback/update`, data })
  },
  // 删除生产报工
  deleteFeedback: async (id: number) => {
    return await request.delete({ url: `/mes/pro/feedback/delete?id=` + id })
  },
  // 导出生产报工 Excel
  exportFeedback: async (params: any) => {
    return await request.download({ url: `/mes/pro/feedback/export-excel`, params })
  },
  // 提交报工
  submitFeedback: async (id: number) => {
    return await request.put({ url: `/mes/pro/feedback/submit?id=` + id })
  },
  // 驳回报工
  rejectFeedback: async (id: number) => {
    return await request.put({ url: `/mes/pro/feedback/reject?id=` + id })
  },
  // 审批报工（返回审批后的状态）
  approveFeedback: async (id: number) => {
    return await request.put({ url: `/mes/pro/feedback/approve?id=` + id })
  }
}
