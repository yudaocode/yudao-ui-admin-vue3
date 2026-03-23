import request from '@/config/axios'

// MES 供应商退货明细 VO
export interface WmReturnVendorDetailVO {
  id?: number
  returnId: number
  lineId: number
  materialStockId: number
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

// MES 供应商退货明细 API
export const WmReturnVendorDetailApi = {
  // 查询供应商退货明细列表（按行编号）
  getReturnVendorDetailListByLineId: async (lineId: number) => {
    return await request.get({ url: '/mes/wm/return-vendor-detail/list-by-line', params: { lineId } })
  },

  // 查询供应商退货明细详情
  getReturnVendorDetail: async (id: number) => {
    return await request.get({ url: '/mes/wm/return-vendor-detail/get?id=' + id })
  },

  // 新增供应商退货明细
  createReturnVendorDetail: async (data: WmReturnVendorDetailVO) => {
    return await request.post({ url: '/mes/wm/return-vendor-detail/create', data })
  },

  // 修改供应商退货明细
  updateReturnVendorDetail: async (data: WmReturnVendorDetailVO) => {
    return await request.put({ url: '/mes/wm/return-vendor-detail/update', data })
  },

  // 删除供应商退货明细
  deleteReturnVendorDetail: async (id: number) => {
    return await request.delete({ url: '/mes/wm/return-vendor-detail/delete?id=' + id })
  }
}
