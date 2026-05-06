import request from '@/config/axios'

// MES 调拨明细 VO
export interface WmTransferDetailVO {
  id: number
  lineId: number
  transferId: number
  itemId: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitName?: string
  unitMeasureName?: string
  quantity: number
  batchId: number
  batchCode?: string
  toWarehouseId: number
  toWarehouseName?: string
  toLocationId: number
  toLocationName?: string
  toAreaId: number
  toAreaName?: string
  remark: string
  createTime?: string
}

// MES 调拨明细 API
export const WmTransferDetailApi = {
  // 查询调拨明细列表（按行编号）
  getTransferDetailListByLineId: async (lineId: number) => {
    return await request.get({ url: '/mes/wm/transfer-detail/list-by-line', params: { lineId } })
  },

  // 查询调拨明细详情
  getTransferDetail: async (id: number) => {
    return await request.get({ url: '/mes/wm/transfer-detail/get?id=' + id })
  },

  // 新增调拨明细
  createTransferDetail: async (data: WmTransferDetailVO) => {
    return await request.post({ url: '/mes/wm/transfer-detail/create', data })
  },

  // 修改调拨明细
  updateTransferDetail: async (data: WmTransferDetailVO) => {
    return await request.put({ url: '/mes/wm/transfer-detail/update', data })
  },

  // 删除调拨明细
  deleteTransferDetail: async (id: number) => {
    return await request.delete({ url: '/mes/wm/transfer-detail/delete?id=' + id })
  }
}
