import request from '@/config/axios'

// MES 产品入库单行 VO
export interface WmProductReceiptLineVO {
  id: number
  receiptId: number
  itemId: number
  materialStockId: number
  itemCode: string
  itemName: string
  specification: string
  unitMeasureName: string
  quantity: number
  batchId: number
  batchCode: string
  remark: string
  createTime: string
}

// MES 产品入库单行 API
export const WmProductReceiptLineApi = {
  // 查询产品入库单行分页
  getProductReceiptLinePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/product-receipt-line/page', params })
  },

  // 查询产品入库单行详情
  getProductReceiptLine: async (id: number) => {
    return await request.get({ url: '/mes/wm/product-receipt-line/get?id=' + id })
  },

  // 新增产品入库单行
  createProductReceiptLine: async (data: WmProductReceiptLineVO) => {
    return await request.post({ url: '/mes/wm/product-receipt-line/create', data })
  },

  // 修改产品入库单行
  updateProductReceiptLine: async (data: WmProductReceiptLineVO) => {
    return await request.put({ url: '/mes/wm/product-receipt-line/update', data })
  },

  // 删除产品入库单行
  deleteProductReceiptLine: async (id: number) => {
    return await request.delete({ url: '/mes/wm/product-receipt-line/delete?id=' + id })
  }
}
