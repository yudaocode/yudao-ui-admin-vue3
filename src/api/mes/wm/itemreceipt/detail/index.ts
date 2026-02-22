import request from '@/config/axios'

// MES 采购入库明细 VO
export interface WmItemReceiptDetailVO {
  id: number
  lineId: number
  receiptId: number
  itemId: number
  itemCode: string
  itemName: string
  specification: string
  unitMeasureName: string
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

// MES 采购入库明细 API
export const WmItemReceiptDetailApi = {
  // 查询采购入库明细分页
  getItemReceiptDetailPage: async (params: any) => {
    return await request.get({ url: '/mes/wm/item-receipt-detail/page', params })
  },

  // 查询采购入库明细详情
  getItemReceiptDetail: async (id: number) => {
    return await request.get({ url: '/mes/wm/item-receipt-detail/get?id=' + id })
  },

  // 新增采购入库明细
  createItemReceiptDetail: async (data: WmItemReceiptDetailVO) => {
    return await request.post({ url: '/mes/wm/item-receipt-detail/create', data })
  },

  // 修改采购入库明细
  updateItemReceiptDetail: async (data: WmItemReceiptDetailVO) => {
    return await request.put({ url: '/mes/wm/item-receipt-detail/update', data })
  },

  // 删除采购入库明细
  deleteItemReceiptDetail: async (id: number) => {
    return await request.delete({ url: '/mes/wm/item-receipt-detail/delete?id=' + id })
  }
}
