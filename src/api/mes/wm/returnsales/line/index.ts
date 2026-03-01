import request from '@/config/axios'

// MES 销售退货单行 VO
export interface WmReturnSalesLineVO {
  id?: number
  returnId: number
  itemId: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  quantityReturned: number
  batchId?: number
  batchCode?: string
  qualityStatus?: number
  remark?: string
}

// MES 销售退货单行 API
export const WmReturnSalesLineApi = {
  // 查询销售退货单行分页
  getReturnSalesLinePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/return-sales-line/page', params })
  },

  // 查询销售退货单行详情
  getReturnSalesLine: async (id: number) => {
    return await request.get({ url: '/mes/wm/return-sales-line/get?id=' + id })
  },

  // 新增销售退货单行
  createReturnSalesLine: async (data: WmReturnSalesLineVO) => {
    return await request.post({ url: '/mes/wm/return-sales-line/create', data })
  },

  // 修改销售退货单行
  updateReturnSalesLine: async (data: WmReturnSalesLineVO) => {
    return await request.put({ url: '/mes/wm/return-sales-line/update', data })
  },

  // 删除销售退货单行
  deleteReturnSalesLine: async (id: number) => {
    return await request.delete({ url: '/mes/wm/return-sales-line/delete?id=' + id })
  }
}
