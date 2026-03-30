import request from '@/config/axios'

// MES 生产退料明细 VO
export interface WmReturnIssueDetailVO {
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

// MES 生产退料明细 API
export const WmReturnIssueDetailApi = {
  // 查询生产退料明细列表（按行编号）
  getReturnIssueDetailListByLineId: async (lineId: number) => {
    return await request.get({
      url: '/mes/wm/return-issue-detail/list-by-line',
      params: { lineId }
    })
  },

  // 查询生产退料明细详情
  getReturnIssueDetail: async (id: number) => {
    return await request.get({ url: '/mes/wm/return-issue-detail/get?id=' + id })
  },

  // 新增生产退料明细
  createReturnIssueDetail: async (data: WmReturnIssueDetailVO) => {
    return await request.post({ url: '/mes/wm/return-issue-detail/create', data })
  },

  // 修改生产退料明细
  updateReturnIssueDetail: async (data: WmReturnIssueDetailVO) => {
    return await request.put({ url: '/mes/wm/return-issue-detail/update', data })
  },

  // 删除生产退料明细
  deleteReturnIssueDetail: async (id: number) => {
    return await request.delete({ url: '/mes/wm/return-issue-detail/delete?id=' + id })
  }
}
