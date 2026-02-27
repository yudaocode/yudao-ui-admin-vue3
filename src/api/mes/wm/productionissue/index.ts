import request from '@/config/axios'

// MES 领料出库单行 VO
export interface WmProductionIssueLineVO {
  id?: number
  issueId?: number
  itemId: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  quantity: number
  batchId?: number
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
  workOrderId?: number
  workOrderCode?: string
  requiredTime?: string
  status?: number
  remark?: string
  createTime?: string
  lines?: WmProductionIssueLineVO[]
}

// MES 领料出库单 API
export const WmProductionIssueApi = {
  // 查询领料出库单分页
  getProductionIssuePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/production-issue/page', params })
  },

  // 查询领料出库单详情
  getProductionIssue: async (id: number) => {
    return await request.get({ url: '/mes/wm/production-issue/get?id=' + id })
  },

  // 新增领料出库单
  createProductionIssue: async (data: WmProductionIssueVO) => {
    return await request.post({ url: '/mes/wm/production-issue/create', data })
  },

  // 修改领料出库单
  updateProductionIssue: async (data: WmProductionIssueVO) => {
    return await request.put({ url: '/mes/wm/production-issue/update', data })
  },

  // 删除领料出库单
  deleteProductionIssue: async (id: number) => {
    return await request.delete({ url: '/mes/wm/production-issue/delete?id=' + id })
  },

  // 提交领料出库单（进入审批流程）
  submitProductionIssue: async (id: number) => {
    return await request.put({ url: '/mes/wm/production-issue/submit?id=' + id })
  },

  // 执行拣货
  stockProductionIssue: async (id: number) => {
    return await request.put({ url: '/mes/wm/production-issue/stock?id=' + id })
  },

  // 完成领料出库单（执行出库）
  finishProductionIssue: async (id: number) => {
    return await request.put({ url: '/mes/wm/production-issue/finish?id=' + id })
  },

  // 导出领料出库单 Excel
  exportProductionIssue: async (params: any) => {
    return await request.download({ url: '/mes/wm/production-issue/export-excel', params })
  }
}
