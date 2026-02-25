import request from '@/config/axios'

// MES 采购入库单 VO
export interface WmItemReceiptVO {
  id: number
  code: string
  name: string
  iqcId: number
  iqcCode: string
  noticeId: number
  noticeCode: string
  purchaseOrderCode: string
  vendorId: number
  vendorName: string
  warehouseId: number
  warehouseName: string
  locationId: number
  locationName: string
  areaId: number
  areaName: string
  receiptDate: string
  status: number
  remark: string
  createTime: string
}

// MES 采购入库单 API
export const WmItemReceiptApi = {
  // 查询采购入库单分页
  getItemReceiptPage: async (params: any) => {
    return await request.get({ url: '/mes/wm/item-receipt/page', params })
  },

  // 查询采购入库单详情
  getItemReceipt: async (id: number) => {
    return await request.get({ url: '/mes/wm/item-receipt/get?id=' + id })
  },

  // 新增采购入库单
  createItemReceipt: async (data: WmItemReceiptVO) => {
    return await request.post({ url: '/mes/wm/item-receipt/create', data })
  },

  // 修改采购入库单
  updateItemReceipt: async (data: WmItemReceiptVO) => {
    return await request.put({ url: '/mes/wm/item-receipt/update', data })
  },

  // 删除采购入库单
  deleteItemReceipt: async (id: number) => {
    return await request.delete({ url: '/mes/wm/item-receipt/delete?id=' + id })
  },

  // 提交采购入库单
  submitItemReceipt: async (id: number) => {
    return await request.put({ url: '/mes/wm/item-receipt/submit?id=' + id })
  },

  // 执行上架
  stockItemReceipt: async (id: number) => {
    return await request.put({ url: '/mes/wm/item-receipt/stock?id=' + id })
  },

  // 执行入库
  executeItemReceipt: async (id: number) => {
    return await request.put({ url: '/mes/wm/item-receipt/execute?id=' + id })
  },

  // 取消采购入库单
  cancelItemReceipt: async (id: number) => {
    return await request.put({ url: '/mes/wm/item-receipt/cancel?id=' + id })
  },

  // 导出采购入库单 Excel
  exportItemReceipt: async (params: any) => {
    return await request.download({ url: '/mes/wm/item-receipt/export-excel', params })
  }
}
