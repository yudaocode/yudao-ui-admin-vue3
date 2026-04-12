import request from '@/config/axios'

// MES 销售出库明细 VO
export interface WmProductSalesDetailVO {
  id: number
  lineId: number
  salesId: number
  itemId: number
  itemCode: string
  itemName: string
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

// MES 销售出库明细 API
export const WmProductSalesDetailApi = {
  // 查询销售出库明细列表（按行编号）
  getProductSalesDetailListByLineId: async (lineId: number) => {
    return await request.get({
      url: '/mes/wm/product-sales-detail/list-by-line',
      params: { lineId }
    })
  },

  // 查询销售出库明细详情
  getProductSalesDetail: async (id: number) => {
    return await request.get({ url: '/mes/wm/product-sales-detail/get?id=' + id })
  },

  // 新增销售出库明细
  createProductSalesDetail: async (data: WmProductSalesDetailVO) => {
    return await request.post({ url: '/mes/wm/product-sales-detail/create', data })
  },

  // 修改销售出库明细
  updateProductSalesDetail: async (data: WmProductSalesDetailVO) => {
    return await request.put({ url: '/mes/wm/product-sales-detail/update', data })
  },

  // 删除销售出库明细
  deleteProductSalesDetail: async (id: number) => {
    return await request.delete({ url: '/mes/wm/product-sales-detail/delete?id=' + id })
  }
}
