import request from '@/config/axios'

// MES 产品入库单明细 VO
export interface WmProductReceiptDetailVO {
  id: number
  lineId: number
  receiptId: number
  itemId: number
  itemCode: string
  quantity: number
  batchId: number
  warehouseId: number
  warehouseName: string
  locationId: number
  locationName: string
  areaId: number
  areaName: string
  remark: string
  createTime: string
}

// MES 产品入库单明细 API
export const WmProductReceiptDetailApi = {
  // 查询产品入库单明细列表
  getProductReceiptDetailList: async (params: any) => {
    return await request.get({ url: '/mes/wm/product-receipt-detail/list', params })
  },

  // 根据行项目ID查询产品入库单明细列表
  getProductReceiptDetailListByLineId: async (lineId: number) => {
    return await request.get({
      url: '/mes/wm/product-receipt-detail/list-by-line',
      params: { lineId }
    })
  },

  // 查询产品入库单明细详情
  getProductReceiptDetail: async (id: number) => {
    return await request.get({ url: '/mes/wm/product-receipt-detail/get?id=' + id })
  },

  // 新增产品入库单明细
  createProductReceiptDetail: async (data: WmProductReceiptDetailVO) => {
    return await request.post({ url: '/mes/wm/product-receipt-detail/create', data })
  },

  // 修改产品入库单明细
  updateProductReceiptDetail: async (data: WmProductReceiptDetailVO) => {
    return await request.put({ url: '/mes/wm/product-receipt-detail/update', data })
  },

  // 删除产品入库单明细
  deleteProductReceiptDetail: async (id: number) => {
    return await request.delete({ url: '/mes/wm/product-receipt-detail/delete?id=' + id })
  }
}
