import request from '@/config/axios'

// MES 采购入库单行 VO
export interface WmItemReceiptLineVO {
  id: number
  receiptId: number
  arrivalNoticeLineId: number
  itemId: number
  itemCode: string
  itemName: string
  specification: string
  unitMeasureName: string
  receivedQuantity: number
  batchId: number
  batchCode: string
  warehouseId: number
  warehouseName: string
  locationId: number
  locationName: string
  areaId: number
  areaName: string
  productionDate: string
  expireDate: string
  lotNumber: string
  iqcCheckFlag: boolean
  iqcId: number
  iqcCode: string
  remark: string
  createTime: string
}

// MES 采购入库单行 API
export const WmItemReceiptLineApi = {
  // 查询采购入库单行分页
  getItemReceiptLinePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/item-receipt-line/page', params })
  },

  // 查询采购入库单行详情
  getItemReceiptLine: async (id: number) => {
    return await request.get({ url: '/mes/wm/item-receipt-line/get?id=' + id })
  },

  // 新增采购入库单行
  createItemReceiptLine: async (data: WmItemReceiptLineVO) => {
    return await request.post({ url: '/mes/wm/item-receipt-line/create', data })
  },

  // 修改采购入库单行
  updateItemReceiptLine: async (data: WmItemReceiptLineVO) => {
    return await request.put({ url: '/mes/wm/item-receipt-line/update', data })
  },

  // 删除采购入库单行
  deleteItemReceiptLine: async (id: number) => {
    return await request.delete({ url: '/mes/wm/item-receipt-line/delete?id=' + id })
  }
}
