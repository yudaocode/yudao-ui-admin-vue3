import request from '@/config/axios'

// MES 销售退货明细 VO
export interface WmReturnSalesDetailVO {
  id?: number
  returnId: number
  lineId: number
  itemId: number
  quantity: number
  batchId?: number
  batchCode?: string
  warehouseId: number
  warehouseName?: string
  locationId?: number
  locationName?: string
  areaId?: number
  areaName?: string
  remark?: string
}

// MES 销售退货明细 API
export const WmReturnSalesDetailApi = {
  // 查询销售退货明细列表（按行编号）
  getReturnSalesDetailListByLineId: async (lineId: number) => {
    return await request.get({
      url: '/mes/wm/return-sales-detail/list-by-line',
      params: { lineId }
    })
  },

  // 查询销售退货明细详情
  getReturnSalesDetail: async (id: number) => {
    return await request.get({ url: '/mes/wm/return-sales-detail/get?id=' + id })
  },

  // 新增销售退货明细
  createReturnSalesDetail: async (data: WmReturnSalesDetailVO) => {
    return await request.post({ url: '/mes/wm/return-sales-detail/create', data })
  },

  // 修改销售退货明细
  updateReturnSalesDetail: async (data: WmReturnSalesDetailVO) => {
    return await request.put({ url: '/mes/wm/return-sales-detail/update', data })
  },

  // 删除销售退货明细
  deleteReturnSalesDetail: async (id: number) => {
    return await request.delete({ url: '/mes/wm/return-sales-detail/delete?id=' + id })
  }
}
