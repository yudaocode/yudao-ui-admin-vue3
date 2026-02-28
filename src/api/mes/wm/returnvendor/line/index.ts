import request from '@/config/axios'

// MES 供应商退货单行 VO
export interface WmReturnVendorLineVO {
  id?: number
  returnVendorId: number
  itemId: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  quantity: number
  batchId?: number
  remark?: string
}

// MES 供应商退货单行 API
export const WmReturnVendorLineApi = {
  // 查询供应商退货单行分页
  getReturnVendorLinePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/return-vendor-line/page', params })
  },

  // 查询供应商退货单行详情
  getReturnVendorLine: async (id: number) => {
    return await request.get({ url: '/mes/wm/return-vendor-line/get?id=' + id })
  },

  // 新增供应商退货单行
  createReturnVendorLine: async (data: WmReturnVendorLineVO) => {
    return await request.post({ url: '/mes/wm/return-vendor-line/create', data })
  },

  // 修改供应商退货单行
  updateReturnVendorLine: async (data: WmReturnVendorLineVO) => {
    return await request.put({ url: '/mes/wm/return-vendor-line/update', data })
  },

  // 删除供应商退货单行
  deleteReturnVendorLine: async (id: number) => {
    return await request.delete({ url: '/mes/wm/return-vendor-line/delete?id=' + id })
  }
}
