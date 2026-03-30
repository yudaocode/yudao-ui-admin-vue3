import request from '@/config/axios'

// MES 领料出库明细 VO
export interface WmProductIssueDetailVO {
  id?: number
  issueId: number
  lineId: number
  materialStockId: number
  itemId: number
  quantity: number
  batchId?: number
  batchCode?: string
  warehouseId: number
  warehouseName?: string
  locationId?: number
  locationName?: string
  areaId?: number
  areaName?: string
  remark?: string
}

// MES 领料出库明细 API
export const WmProductIssueDetailApi = {
  // 查询领料出库明细列表（按行编号）
  getProductIssueDetailListByLineId: async (lineId: number) => {
    return await request.get({
      url: '/mes/wm/product-issue-detail/list-by-line',
      params: { lineId }
    })
  },

  // 查询领料出库明细详情
  getProductIssueDetail: async (id: number) => {
    return await request.get({ url: '/mes/wm/product-issue-detail/get?id=' + id })
  },

  // 新增领料出库明细
  createProductIssueDetail: async (data: WmProductIssueDetailVO) => {
    return await request.post({ url: '/mes/wm/product-issue-detail/create', data })
  },

  // 修改领料出库明细
  updateProductIssueDetail: async (data: WmProductIssueDetailVO) => {
    return await request.put({ url: '/mes/wm/product-issue-detail/update', data })
  },

  // 删除领料出库明细
  deleteProductIssueDetail: async (id: number) => {
    return await request.delete({ url: '/mes/wm/product-issue-detail/delete?id=' + id })
  }
}
