import request from '@/config/axios'

// MES 发货通知单行 VO
export interface WmSalesNoticeLineVO {
  id: number
  noticeId: number
  itemId: number
  materialStockId: number
  itemCode: string
  itemName: string
  specification: string
  unitMeasureName: string
  batchId: number
  batchCode: string
  quantity: number
  oqcCheck: boolean
  remark: string
  createTime: string
}

// MES 发货通知单行 API
export const WmSalesNoticeLineApi = {
  // 查询发货通知单行分页
  getSalesNoticeLinePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/sales-notice-line/page', params })
  },

  // 查询发货通知单行详情
  getSalesNoticeLine: async (id: number) => {
    return await request.get({ url: '/mes/wm/sales-notice-line/get?id=' + id })
  },

  // 新增发货通知单行
  createSalesNoticeLine: async (data: WmSalesNoticeLineVO) => {
    return await request.post({ url: '/mes/wm/sales-notice-line/create', data })
  },

  // 修改发货通知单行
  updateSalesNoticeLine: async (data: WmSalesNoticeLineVO) => {
    return await request.put({ url: '/mes/wm/sales-notice-line/update', data })
  },

  // 删除发货通知单行
  deleteSalesNoticeLine: async (id: number) => {
    return await request.delete({ url: '/mes/wm/sales-notice-line/delete?id=' + id })
  }
}
