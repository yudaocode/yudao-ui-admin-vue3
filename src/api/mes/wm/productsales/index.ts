import request from '@/config/axios'

// MES 销售出库单 VO
export interface WmProductSalesVO {
  id: number
  code: string
  name: string
  clientId: number
  clientName: string
  salesOrderCode: string
  shipmentDate: string
  contactName: string
  contactTelephone: string
  status: number
  remark: string
  createTime: string
}

// MES 销售出库单 API
export const WmProductSalesApi = {
  // 查询销售出库单分页
  getProductSalesPage: async (params: any) => {
    return await request.get({ url: '/mes/wm/product-sales/page', params })
  },

  // 查询销售出库单详情
  getProductSales: async (id: number) => {
    return await request.get({ url: '/mes/wm/product-sales/get?id=' + id })
  },

  // 新增销售出库单
  createProductSales: async (data: WmProductSalesVO) => {
    return await request.post({ url: '/mes/wm/product-sales/create', data })
  },

  // 修改销售出库单
  updateProductSales: async (data: WmProductSalesVO) => {
    return await request.put({ url: '/mes/wm/product-sales/update', data })
  },

  // 删除销售出库单
  deleteProductSales: async (id: number) => {
    return await request.delete({ url: '/mes/wm/product-sales/delete?id=' + id })
  },

  // 提交销售出库单
  submitProductSales: async (id: number) => {
    return await request.put({ url: '/mes/wm/product-sales/submit?id=' + id })
  },

  // 校验销售出库单数量
  checkProductSalesQuantity: async (id: number) => {
    return await request.get({ url: '/mes/wm/product-sales/check-quantity?id=' + id })
  },

  // 执行拣货
  stockProductSales: async (id: number) => {
    return await request.put({ url: '/mes/wm/product-sales/stock?id=' + id })
  },

  // 填写运单
  shippingProductSales: async (data: WmProductSalesVO) => {
    return await request.put({ url: '/mes/wm/product-sales/shipping', data })
  },

  // 执行出库
  finishProductSales: async (id: number) => {
    return await request.put({ url: '/mes/wm/product-sales/finish?id=' + id })
  },

  // 取消销售出库单
  cancelProductSales: async (id: number) => {
    return await request.put({ url: '/mes/wm/product-sales/cancel?id=' + id })
  },

  // 导出销售出库单 Excel
  exportProductSales: async (params: any) => {
    return await request.download({ url: '/mes/wm/product-sales/export-excel', params })
  }
}
