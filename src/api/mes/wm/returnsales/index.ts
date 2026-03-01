import request from '@/config/axios'

// MES 销售退货单 VO
export interface WmReturnSalesVO {
  id?: number
  code?: string
  name: string
  salesOrderCode?: string
  clientId?: number
  clientCode?: string
  clientName?: string
  returnDate?: string
  returnReason?: string
  status?: number
  remark?: string
  createTime?: string
}

// MES 销售退货单 API
export const WmReturnSalesApi = {
  // 查询销售退货单分页
  getReturnSalesPage: async (params: any) => {
    return await request.get({ url: '/mes/wm/return-sales/page', params })
  },

  // 查询销售退货单详情
  getReturnSales: async (id: number) => {
    return await request.get({ url: '/mes/wm/return-sales/get?id=' + id })
  },

  // 新增销售退货单
  createReturnSales: async (data: WmReturnSalesVO) => {
    return await request.post({ url: '/mes/wm/return-sales/create', data })
  },

  // 修改销售退货单
  updateReturnSales: async (data: WmReturnSalesVO) => {
    return await request.put({ url: '/mes/wm/return-sales/update', data })
  },

  // 删除销售退货单
  deleteReturnSales: async (id: number) => {
    return await request.delete({ url: '/mes/wm/return-sales/delete?id=' + id })
  },

  // 提交销售退货单
  submitReturnSales: async (id: number) => {
    return await request.put({ url: '/mes/wm/return-sales/submit?id=' + id })
  },

  // 执行退货
  executeReturnSales: async (id: number) => {
    return await request.put({ url: '/mes/wm/return-sales/execute?id=' + id })
  },

  // 执行上架
  stockReturnSales: async (id: number) => {
    return await request.put({ url: '/mes/wm/return-sales/stock?id=' + id })
  },

  // 取消销售退货单
  cancelReturnSales: async (id: number) => {
    return await request.put({ url: '/mes/wm/return-sales/cancel?id=' + id })
  },

  // 导出销售退货单 Excel
  exportReturnSales: async (params: any) => {
    return await request.download({ url: '/mes/wm/return-sales/export-excel', params })
  }
}
