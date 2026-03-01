import request from '@/config/axios'

// MES 产品入库单明细 VO
export interface WmProductRecptDetailVO {
  id: number
  lineId: number
  recptId: number
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
export const WmProductRecptDetailApi = {
  // 查询产品入库单明细列表
  getProductRecptDetailList: async (params: any) => {
    return await request.get({ url: '/mes/wm/product-recpt-detail/list', params })
  },

  // 根据行项目ID查询产品入库单明细列表
  getProductRecptDetailListByLineId: async (lineId: number) => {
    return await request.get({ url: '/mes/wm/product-recpt-detail/list-by-line', params: { lineId } })
  },

  // 查询产品入库单明细详情
  getProductRecptDetail: async (id: number) => {
    return await request.get({ url: '/mes/wm/product-recpt-detail/get?id=' + id })
  },

  // 新增产品入库单明细
  createProductRecptDetail: async (data: WmProductRecptDetailVO) => {
    return await request.post({ url: '/mes/wm/product-recpt-detail/create', data })
  },

  // 修改产品入库单明细
  updateProductRecptDetail: async (data: WmProductRecptDetailVO) => {
    return await request.put({ url: '/mes/wm/product-recpt-detail/update', data })
  },

  // 删除产品入库单明细
  deleteProductRecptDetail: async (id: number) => {
    return await request.delete({ url: '/mes/wm/product-recpt-detail/delete?id=' + id })
  }
}
