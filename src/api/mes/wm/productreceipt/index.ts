import request from '@/config/axios'

// MES 产品入库单 VO
export interface WmProductReceiptVO {
  id: number
  code: string
  name: string
  workOrderId: number
  workOrderCode: string
  itemId: number
  itemCode: string
  itemName: string
  specification: string
  unitMeasureName: string
  receiptDate: string
  status: number
  remark: string
  createTime: string
}

// MES 产品入库单 API
export const WmProductReceiptApi = {
  // 查询产品入库单分页
  getProductReceiptPage: async (params: any) => {
    return await request.get({ url: '/mes/wm/product-receipt/page', params })
  },

  // 查询产品入库单详情
  getProductReceipt: async (id: number) => {
    return await request.get({ url: '/mes/wm/product-receipt/get?id=' + id })
  },

  // 新增产品入库单
  createProductReceipt: async (data: WmProductReceiptVO) => {
    return await request.post({ url: '/mes/wm/product-receipt/create', data })
  },

  // 修改产品入库单
  updateProductReceipt: async (data: WmProductReceiptVO) => {
    return await request.put({ url: '/mes/wm/product-receipt/update', data })
  },

  // 删除产品入库单
  deleteProductReceipt: async (id: number) => {
    return await request.delete({ url: '/mes/wm/product-receipt/delete?id=' + id })
  },

  // 提交产品入库单
  submitProductReceipt: async (id: number) => {
    return await request.put({ url: '/mes/wm/product-receipt/submit?id=' + id })
  },

  // 执行上架
  stockProductReceipt: async (id: number) => {
    return await request.put({ url: '/mes/wm/product-receipt/stock?id=' + id })
  },

  // 执行入库
  finishProductReceipt: async (id: number) => {
    return await request.put({ url: '/mes/wm/product-receipt/finish?id=' + id })
  },

  // 取消产品入库单
  cancelProductReceipt: async (id: number) => {
    return await request.put({ url: '/mes/wm/product-receipt/cancel?id=' + id })
  },

  // 校验产品入库单明细数量
  checkProductReceiptQuantity: async (id: number) => {
    return await request.get({ url: '/mes/wm/product-receipt/check-quantity?id=' + id })
  },

  // 导出产品入库单 Excel
  exportProductReceipt: async (params: any) => {
    return await request.download({ url: '/mes/wm/product-receipt/export-excel', params })
  }
}
