import request from '@/config/axios'

// MES 委外收货明细 VO
export interface WmOutsourceReceiptDetailVO {
  id: number
  lineId: number
  receiptId: number
  itemId: number
  itemCode: string
  itemName: string
  batchCode: string
  quantity: number
  locationId: number
  locationName: string
  remark: string
  createTime: string
}

// MES 委外收货明细 API
export const WmOutsourceReceiptDetailApi = {
  // 查询委外收货明细列表（按行编号）
  getOutsourceReceiptDetailListByLineId: async (lineId: number) => {
    return await request.get({
      url: '/mes/wm/outsource-receipt-detail/list-by-line',
      params: { lineId }
    })
  },

  // 查询委外收货明细详情
  getOutsourceReceiptDetail: async (id: number) => {
    return await request.get({ url: '/mes/wm/outsource-receipt-detail/get?id=' + id })
  },

  // 新增委外收货明细
  createOutsourceReceiptDetail: async (data: WmOutsourceReceiptDetailVO) => {
    return await request.post({ url: '/mes/wm/outsource-receipt-detail/create', data })
  },

  // 修改委外收货明细
  updateOutsourceReceiptDetail: async (data: WmOutsourceReceiptDetailVO) => {
    return await request.put({ url: '/mes/wm/outsource-receipt-detail/update', data })
  },

  // 删除委外收货明细
  deleteOutsourceReceiptDetail: async (id: number) => {
    return await request.delete({ url: '/mes/wm/outsource-receipt-detail/delete?id=' + id })
  }
}
