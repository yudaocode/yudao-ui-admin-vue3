import request from '@/config/axios'

// MES 发货通知单 VO
export interface WmSalesNoticeVO {
  id: number
  code: string
  name: string
  salesOrderCode: string
  clientId: number
  clientCode: string
  clientName: string
  salesDate: string
  recipientName: string
  recipientTelephone: string
  recipientAddress: string
  status: number
  remark: string
  createTime: string
}

// MES 发货通知单 API
export const WmSalesNoticeApi = {
  // 查询发货通知单分页
  getSalesNoticePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/sales-notice/page', params })
  },

  // 查询发货通知单详情
  getSalesNotice: async (id: number) => {
    return await request.get({ url: '/mes/wm/sales-notice/get?id=' + id })
  },

  // 新增发货通知单
  createSalesNotice: async (data: WmSalesNoticeVO) => {
    return await request.post({ url: '/mes/wm/sales-notice/create', data })
  },

  // 修改发货通知单
  updateSalesNotice: async (data: WmSalesNoticeVO) => {
    return await request.put({ url: '/mes/wm/sales-notice/update', data })
  },

  // 删除发货通知单
  deleteSalesNotice: async (id: number) => {
    return await request.delete({ url: '/mes/wm/sales-notice/delete?id=' + id })
  },

  // 提交发货通知单
  submitSalesNotice: async (id: number) => {
    return await request.put({ url: '/mes/wm/sales-notice/submit?id=' + id })
  },

  // 导出发货通知单 Excel
  exportSalesNotice: async (params: any) => {
    return await request.download({ url: '/mes/wm/sales-notice/export-excel', params })
  }
}
