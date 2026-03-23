import request from '@/config/axios'

// MES 领料出库单行 VO
export interface WmProductIssueLineVO {
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
export const WmProductIssueLineApi = {
  // 查询领料出库单行分页
  getProductIssueLinePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/product-issue-line/page', params })
  },

  // 查询领料出库单行详情
  getProductIssueLine: async (id: number) => {
    return await request.get({ url: '/mes/wm/product-issue-line/get?id=' + id })
  },

  // 新增领料出库单行
  createProductIssueLine: async (data: WmProductIssueLineVO) => {
    return await request.post({ url: '/mes/wm/product-issue-line/create', data })
  },

  // 修改领料出库单行
  updateProductIssueLine: async (data: WmProductIssueLineVO) => {
    return await request.put({ url: '/mes/wm/product-issue-line/update', data })
  },

  // 删除领料出库单行
  deleteProductIssueLine: async (id: number) => {
    return await request.delete({ url: '/mes/wm/product-issue-line/delete?id=' + id })
  }
}
