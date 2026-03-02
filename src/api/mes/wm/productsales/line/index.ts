import request from '@/config/axios'

// MES 销售出库单行 VO
export interface WmProductSalesLineVO {
  id: number
  salesId: number
  itemId: number
  itemCode: string
  itemName: string
  quantity: number
  pickedQuantity: number
  batchId: number
  remark: string
  createTime: string
}

// MES 销售出库单行 API
export const WmProductSalesLineApi = {
  // 查询销售出库单行列表（按出库单编号）
  getProductSalesLineListBySalesId: async (salesId: number) => {
    return await request.get({
      url: '/mes/wm/product-sales-line/list-by-sales-id?salesId=' + salesId
    })
  },

  // 查询销售出库单行详情
  getProductSalesLine: async (id: number) => {
    return await request.get({ url: '/mes/wm/product-sales-line/get?id=' + id })
  },

  // 新增销售出库单行
  createProductSalesLine: async (data: WmProductSalesLineVO) => {
    return await request.post({ url: '/mes/wm/product-sales-line/create', data })
  },

  // 修改销售出库单行
  updateProductSalesLine: async (data: WmProductSalesLineVO) => {
    return await request.put({ url: '/mes/wm/product-sales-line/update', data })
  },

  // 删除销售出库单行
  deleteProductSalesLine: async (id: number) => {
    return await request.delete({ url: '/mes/wm/product-sales-line/delete?id=' + id })
  }
}
