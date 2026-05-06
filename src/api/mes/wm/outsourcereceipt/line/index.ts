import request from '@/config/axios'

// MES 委外收货单行 VO
export interface WmOutsourceReceiptLineVO {
  id: number
  receiptId: number
  itemId: number
  itemCode: string
  itemName: string
  specification: string
  quantity: number
  unitId: number
  unitName: string
  batchId: number
  batchCode: string
  productionDate: string
  expireDate: string
  lotNumber: string
  iqcCheck: boolean
  iqcId: number
  qualityStatus: number
  remark: string
  createTime: string
}

// MES 委外收货单行 API
export const WmOutsourceReceiptLineApi = {
  // 查询委外收货单行分页
  getOutsourceReceiptLinePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/outsource-receipt-line/page', params })
  },

  // 查询委外收货单行详情
  getOutsourceReceiptLine: async (id: number) => {
    return await request.get({ url: '/mes/wm/outsource-receipt-line/get?id=' + id })
  },

  // 新增委外收货单行
  createOutsourceReceiptLine: async (data: WmOutsourceReceiptLineVO) => {
    return await request.post({ url: '/mes/wm/outsource-receipt-line/create', data })
  },

  // 修改委外收货单行
  updateOutsourceReceiptLine: async (data: WmOutsourceReceiptLineVO) => {
    return await request.put({ url: '/mes/wm/outsource-receipt-line/update', data })
  },

  // 删除委外收货单行
  deleteOutsourceReceiptLine: async (id: number) => {
    return await request.delete({ url: '/mes/wm/outsource-receipt-line/delete?id=' + id })
  }
}
