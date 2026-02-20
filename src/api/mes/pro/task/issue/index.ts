import request from '@/config/axios'

// MES 生产任务投料 VO
export interface ProTaskIssueVO {
  id: number // 编号
  taskId: number // 生产任务编号
  workOrderId: number // 生产工单编号
  workstationId: number // 工作站编号
  sourceDocId: number // 来源单据编号
  sourceDocCode: string // 来源单据编码
  sourceDocType: string // 来源单据类型
  batchCode: string // 投料批次
  sourceLineId: number // 来源单据行编号
  itemId: number // 产品物料编号
  itemName: string // 产品名称
  itemCode: string // 产品编码
  itemSpec: string // 规格型号
  unitMeasureId: number // 单位编号
  unitMeasureName: string // 单位名称
  issuedQuantity: number // 总投料数量
  availableQuantity: number // 当前可用数量
  usedQuantity: number // 当前使用数量
  remark: string // 备注
}

// MES 生产任务投料 API
export const ProTaskIssueApi = {
  // 查询生产任务投料分页
  getTaskIssuePage: async (params: any) => {
    return await request.get({ url: `/mes/pro/task-issue/page`, params })
  },

  // 查询生产任务投料详情
  getTaskIssue: async (id: number) => {
    return await request.get({ url: `/mes/pro/task-issue/get?id=` + id })
  },

  // 新增生产任务投料
  createTaskIssue: async (data: ProTaskIssueVO) => {
    return await request.post({ url: `/mes/pro/task-issue/create`, data })
  },

  // 修改生产任务投料
  updateTaskIssue: async (data: ProTaskIssueVO) => {
    return await request.put({ url: `/mes/pro/task-issue/update`, data })
  },

  // 删除生产任务投料
  deleteTaskIssue: async (id: number) => {
    return await request.delete({ url: `/mes/pro/task-issue/delete?id=` + id })
  },

  // 按任务查询投料列表
  getTaskIssueListByTask: async (taskId: number) => {
    return await request.get({ url: `/mes/pro/task-issue/list-by-task?taskId=` + taskId })
  }
}
