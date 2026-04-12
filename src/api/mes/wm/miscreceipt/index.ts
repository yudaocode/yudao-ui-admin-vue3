import request from '@/config/axios'

// MES 杂项入库单 VO
export interface WmMiscReceiptVO {
  id: number
  code: string
  name: string
  type: number
  sourceDocType: string
  sourceDocId: number
  sourceDocCode: string
  receiptDate: string
  status: number
  remark: string
  createTime: string
}

// MES 杂项入库单 API
export const WmMiscReceiptApi = {
  // 查询杂项入库单分页
  getMiscReceiptPage: async (params: any) => {
    return await request.get({ url: '/mes/wm/misc-receipt/page', params })
  },

  // 查询杂项入库单详情
  getMiscReceipt: async (id: number) => {
    return await request.get({ url: '/mes/wm/misc-receipt/get?id=' + id })
  },

  // 新增杂项入库单
  createMiscReceipt: async (data: WmMiscReceiptVO) => {
    return await request.post({ url: '/mes/wm/misc-receipt/create', data })
  },

  // 修改杂项入库单
  updateMiscReceipt: async (data: WmMiscReceiptVO) => {
    return await request.put({ url: '/mes/wm/misc-receipt/update', data })
  },

  // 删除杂项入库单
  deleteMiscReceipt: async (id: number) => {
    return await request.delete({ url: '/mes/wm/misc-receipt/delete?id=' + id })
  },

  // 提交审批
  submitMiscReceipt: async (id: number) => {
    return await request.put({ url: '/mes/wm/misc-receipt/submit?id=' + id })
  },

  // 执行入库
  finishMiscReceipt: async (id: number) => {
    return await request.put({ url: '/mes/wm/misc-receipt/finish?id=' + id })
  },

  // 取消杂项入库单
  cancelMiscReceipt: async (id: number) => {
    return await request.put({ url: '/mes/wm/misc-receipt/cancel?id=' + id })
  },

  // 导出杂项入库单 Excel
  exportMiscReceipt: async (params: any) => {
    return await request.download({ url: '/mes/wm/misc-receipt/export-excel', params })
  }
}
