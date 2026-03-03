import request from '@/config/axios'

// MES 委外收货单 VO
export interface WmOutsourceReceiptVO {
  id: number
  code: string
  name: string
  vendorId: number
  vendorName: string
  warehouseId: number
  warehouseName: string
  receiptDate: string
  status: number
  remark: string
  createTime: string
}

// MES 委外收货单明细 VO
export interface WmOutsourceReceiptLineVO {
  id: number
  receiptId: number
  itemId: number
  itemCode: string
  itemName: string
  quantity: number
  unitId: number
  unitName: string
  remark: string
}

// MES 委外收货单详情 VO
export interface WmOutsourceReceiptDetailVO {
  id: number
  lineId: number
  batchCode: string
  quantity: number
  locationId: number
  locationName: string
  remark: string
}

// MES 委外收货单 API
export const WmOutsourceReceiptApi = {
  // 查询委外收货单分页
  getOutsourceReceiptPage: async (params: any) => {
    return await request.get({ url: '/mes/wm/outsource-receipt/page', params })
  },

  // 查询委外收货单详情
  getOutsourceReceipt: async (id: number) => {
    return await request.get({ url: '/mes/wm/outsource-receipt/get?id=' + id })
  },

  // 新增委外收货单
  createOutsourceReceipt: async (data: WmOutsourceReceiptVO) => {
    return await request.post({ url: '/mes/wm/outsource-receipt/create', data })
  },

  // 修改委外收货单
  updateOutsourceReceipt: async (data: WmOutsourceReceiptVO) => {
    return await request.put({ url: '/mes/wm/outsource-receipt/update', data })
  },

  // 删除委外收货单
  deleteOutsourceReceipt: async (id: number) => {
    return await request.delete({ url: '/mes/wm/outsource-receipt/delete?id=' + id })
  },

  // 提交委外收货单
  submitOutsourceReceipt: async (id: number) => {
    return await request.put({ url: '/mes/wm/outsource-receipt/submit?id=' + id })
  },

  // 审批委外收货单
  approveOutsourceReceipt: async (id: number) => {
    return await request.put({ url: '/mes/wm/outsource-receipt/approve?id=' + id })
  },

  // 完成委外收货单
  finishOutsourceReceipt: async (id: number) => {
    return await request.put({ url: '/mes/wm/outsource-receipt/finish?id=' + id })
  },

  // 取消委外收货单
  cancelOutsourceReceipt: async (id: number) => {
    return await request.put({ url: '/mes/wm/outsource-receipt/cancel?id=' + id })
  },

  // 导出委外收货单 Excel
  exportOutsourceReceipt: async (params: any) => {
    return await request.download({ url: '/mes/wm/outsource-receipt/export-excel', params })
  }
}
