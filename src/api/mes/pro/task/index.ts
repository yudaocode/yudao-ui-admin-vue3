import request from '@/config/axios'

// MES 生产任务 VO
export interface ProTaskVO {
  id: number // 编号
  code: string // 任务编码
  name: string // 任务名称
  workOrderId: number // 生产工单编号
  workOrderCode: string // 工单编码
  workOrderName: string // 工单名称
  workstationId: number // 工作站编号
  workstationName: string // 工作站名称
  routeId: number // 工艺路线编号
  processId: number // 工序编号
  processName: string // 工序名称
  itemId: number // 产品物料编号
  itemName: string // 产品名称
  itemCode: string // 产品编码
  itemSpec: string // 规格型号
  unitMeasureId: number // 单位编号
  unitMeasureName: string // 单位名称
  quantity: number // 排产数量
  producedQuantity: number // 已生产数量
  qualifyQuantity: number // 合格品数量
  unqualifyQuantity: number // 不良品数量
  changedQuantity: number // 调整数量
  clientId: number // 客户编号
  clientName: string // 客户名称
  startTime: Date // 开始生产时间
  duration: number // 生产时长（工作日，1=8小时）
  endTime: Date // 结束生产时间
  colorCode: string // 甘特图显示颜色
  requestDate: Date // 需求日期（从工单查）
  finishDate: Date // 完成日期
  cancelDate: Date // 取消日期
  status: number // 任务状态
  remark: string // 备注
}

// MES 生产任务 API
export const ProTaskApi = {
  // 查询生产任务分页
  getTaskPage: async (params: any) => {
    return await request.get({ url: `/mes/pro/task/page`, params })
  },

  // 查询生产任务详情
  getTask: async (id: number) => {
    return await request.get({ url: `/mes/pro/task/get?id=` + id })
  },

  // 新增生产任务
  createTask: async (data: ProTaskVO) => {
    return await request.post({ url: `/mes/pro/task/create`, data })
  },

  // 修改生产任务
  updateTask: async (data: ProTaskVO) => {
    return await request.put({ url: `/mes/pro/task/update`, data })
  },

  // 删除生产任务
  deleteTask: async (id: number) => {
    return await request.delete({ url: `/mes/pro/task/delete?id=` + id })
  },

  // 导出生产任务 Excel
  exportTask: async (params: any) => {
    return await request.download({ url: `/mes/pro/task/export-excel`, params })
  }
}
