import request from '@/config/axios'

// MES 生产入库明细 VO
export interface WmProductProduceDetailVO {
  id?: number
  produceId: number
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

// MES 生产入库明细 API
export const WmProductProduceDetailApi = {
  // 查询生产入库明细列表（按行编号）
  getProductProduceDetailListByLineId: async (lineId: number) => {
    return await request.get({ url: '/mes/wm/product-produce-detail/list-by-line', params: { lineId } })
  },

  // 查询生产入库明细详情
  getProductProduceDetail: async (id: number) => {
    return await request.get({ url: '/mes/wm/product-produce-detail/get?id=' + id })
  },

  // 新增生产入库明细
  createProductProduceDetail: async (data: WmProductProduceDetailVO) => {
    return await request.post({ url: '/mes/wm/product-produce-detail/create', data })
  },

  // 修改生产入库明细
  updateProductProduceDetail: async (data: WmProductProduceDetailVO) => {
    return await request.put({ url: '/mes/wm/product-produce-detail/update', data })
  },

  // 删除生产入库明细
  deleteProductProduceDetail: async (id: number) => {
    return await request.delete({ url: '/mes/wm/product-produce-detail/delete?id=' + id })
  }
}
