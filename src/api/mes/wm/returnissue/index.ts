import request from '@/config/axios'

// MES 生产退料单 VO
export interface WmReturnIssueVO {
  id?: number
  code?: string
  name: string
  workstationId?: number
  workstationName?: string
  workOrderId?: number
  workOrderCode?: string
  type?: number
  returnDate?: string
  status?: number
  remark?: string
  createTime?: string
}

// MES 生产退料单 API
export const WmReturnIssueApi = {
  // 查询生产退料单分页
  getReturnIssuePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/return-issue/page', params })
  },

  // 查询生产退料单详情
  getReturnIssue: async (id: number) => {
    return await request.get({ url: '/mes/wm/return-issue/get?id=' + id })
  },

  // 新增生产退料单
  createReturnIssue: async (data: WmReturnIssueVO) => {
    return await request.post({ url: '/mes/wm/return-issue/create', data })
  },

  // 修改生产退料单
  updateReturnIssue: async (data: WmReturnIssueVO) => {
    return await request.put({ url: '/mes/wm/return-issue/update', data })
  },

  // 删除生产退料单
  deleteReturnIssue: async (id: number) => {
    return await request.delete({ url: '/mes/wm/return-issue/delete?id=' + id })
  },

  // 提交生产退料单（草稿 → 待检验/待上架）
  submitReturnIssue: async (id: number) => {
    return await request.put({ url: '/mes/wm/return-issue/submit?id=' + id })
  },

  // 入库上架
  stockReturnIssue: async (id: number) => {
    return await request.put({ url: '/mes/wm/return-issue/stock?id=' + id })
  },

  // 取消生产退料单
  cancelReturnIssue: async (id: number) => {
    return await request.put({ url: '/mes/wm/return-issue/cancel?id=' + id })
  },

  // 完成生产退料单
  finishReturnIssue: async (id: number) => {
    return await request.put({ url: '/mes/wm/return-issue/finish?id=' + id })
  },

  // 校验生产退料单数量（每行明细数量之和是否等于行退料数量）
  checkReturnIssueQuantity: async (id: number) => {
    return await request.get({ url: '/mes/wm/return-issue/check-quantity?id=' + id })
  },

  // 导出生产退料单 Excel
  exportReturnIssue: async (params: any) => {
    return await request.download({ url: '/mes/wm/return-issue/export-excel', params })
  }
}
