import request from '@/config/axios'

// MES 领料出库单行 VO
export interface WmProductionIssueLineVO {
  id?: number
  issueId: number
  itemId: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  quantity: number
  batchId?: number
  remark?: string
}

// MES 领料出库单行 API
export const WmProductionIssueLineApi = {
  // 查询领料出库单行分页
  getProductionIssueLinePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/production-issue-line/page', params })
  },

  // 查询领料出库单行详情
  getProductionIssueLine: async (id: number) => {
    return await request.get({ url: '/mes/wm/production-issue-line/get?id=' + id })
  },

  // 新增领料出库单行
  createProductionIssueLine: async (data: WmProductionIssueLineVO) => {
    return await request.post({ url: '/mes/wm/production-issue-line/create', data })
  },

  // 修改领料出库单行
  updateProductionIssueLine: async (data: WmProductionIssueLineVO) => {
    return await request.put({ url: '/mes/wm/production-issue-line/update', data })
  },

  // 删除领料出库单行
  deleteProductionIssueLine: async (id: number) => {
    return await request.delete({ url: '/mes/wm/production-issue-line/delete?id=' + id })
  }
}
