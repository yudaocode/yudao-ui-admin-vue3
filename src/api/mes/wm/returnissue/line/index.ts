import request from '@/config/axios'

// MES 生产退料单行 VO
export interface WmReturnIssueLineVO {
  id?: number
  issueId: number
  itemId: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  quantity: number
  batchId?: number
  qcFlag?: boolean
  qualityStatus?: number
  rqcId?: number
  remark?: string
}

// MES 生产退料单行 API
export const WmReturnIssueLineApi = {
  // 查询生产退料单行分页
  getReturnIssueLinePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/return-issue-line/page', params })
  },

  // 查询生产退料单行详情
  getReturnIssueLine: async (id: number) => {
    return await request.get({ url: '/mes/wm/return-issue-line/get?id=' + id })
  },

  // 新增生产退料单行
  createReturnIssueLine: async (data: WmReturnIssueLineVO) => {
    return await request.post({ url: '/mes/wm/return-issue-line/create', data })
  },

  // 修改生产退料单行
  updateReturnIssueLine: async (data: WmReturnIssueLineVO) => {
    return await request.put({ url: '/mes/wm/return-issue-line/update', data })
  },

  // 删除生产退料单行
  deleteReturnIssueLine: async (id: number) => {
    return await request.delete({ url: '/mes/wm/return-issue-line/delete?id=' + id })
  }
}
