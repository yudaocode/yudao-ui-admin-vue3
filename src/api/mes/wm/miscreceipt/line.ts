import request from '@/config/axios'

// MES 杂项入库单行 VO
// TODO @AI：搞到：line/index.ts 里；
export interface WmMiscReceiptLineVO {
  id: number
  receiptId: number
  itemId: number
  quantity: number
  batchCode: string
  warehouseId: number
  locationId: number
  areaId: number
  productionDate: string
  expireDate: string
  lotNumber: string
  remark: string
  createTime: string
}

// MES 杂项入库单行 API
export const WmMiscReceiptLineApi = {
  // 查询杂项入库单行详情
  getMiscReceiptLine: async (id: number) => {
    return await request.get({ url: '/mes/wm/misc-receipt-line/get?id=' + id })
  },

  // 查询杂项入库单行列表
  getMiscReceiptLineListByReceiptId: async (receiptId: number) => {
    return await request.get({
      url: '/mes/wm/misc-receipt-line/list-by-receipt-id?receiptId=' + receiptId
    })
  },

  // 新增杂项入库单行
  createMiscReceiptLine: async (data: WmMiscReceiptLineVO) => {
    return await request.post({ url: '/mes/wm/misc-receipt-line/create', data })
  },

  // 修改杂项入库单行
  updateMiscReceiptLine: async (data: WmMiscReceiptLineVO) => {
    return await request.put({ url: '/mes/wm/misc-receipt-line/update', data })
  },

  // 删除杂项入库单行
  deleteMiscReceiptLine: async (id: number) => {
    return await request.delete({ url: '/mes/wm/misc-receipt-line/delete?id=' + id })
  }
}
