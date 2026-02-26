import request from '@/config/axios'

// TODO @AI：对齐 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/api/mes/wm/itemreceipt/index.ts；
// MES 领料出库单行 VO
export interface WmProductionIssueLineVO {
  id?: number
  issueId?: number
  itemId: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitOfMeasure?: string
  quantityIssued: number
  batchId?: number
  batchCode?: string
  remark?: string
}

// MES 领料出库单 VO
export interface WmProductionIssueVO {
  id?: number
  code?: string
  name: string
  workstationId?: number
  workstationCode?: string
  workstationName?: string
  workorderId?: number
  workorderCode?: string
  taskId?: number
  taskCode?: string
  clientId?: number
  clientCode?: string
  clientName?: string
  clientNickname?: string
  issueDate?: string
  requiredTime?: string
  status?: number
  remark?: string
  createTime?: string
  lines?: WmProductionIssueLineVO[]
}

// MES 领料出库单 API
export const WmProductionIssueApi = {
  // 查询领料出库单分页
  getIssuePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/production-issue/page', params })
  },

  // 查询领料出库单详情
  getIssue: async (id: number) => {
    return await request.get({ url: '/mes/wm/production-issue/get?id=' + id })
  },

  // 新增领料出库单
  createIssue: async (data: WmProductionIssueVO) => {
    return await request.post({ url: '/mes/wm/production-issue/create', data })
  },

  // 修改领料出库单
  updateIssue: async (data: WmProductionIssueVO) => {
    return await request.put({ url: '/mes/wm/production-issue/update', data })
  },

  // 删除领料出库单
  deleteIssue: async (id: number) => {
    return await request.delete({ url: '/mes/wm/production-issue/delete?id=' + id })
  },

  // 完成领料出库单（执行出库）
  finishIssue: async (id: number) => {
    return await request.put({ url: '/mes/wm/production-issue/finish?id=' + id })
  },

  // 导出领料出库单 Excel
  exportIssue: async (params: any) => {
    return await request.download({ url: '/mes/wm/production-issue/export-excel', params })
  }
}
