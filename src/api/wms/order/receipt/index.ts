import request from '@/config/axios'
import { ReceiptOrderDetailVO } from './detail'

// WMS 入库单 VO
export interface ReceiptOrderVO {
  id?: number
  no?: string
  type?: number
  orderTime?: string
  status?: number
  bizOrderNo?: string
  merchantId?: number
  merchantName?: string
  remark?: string
  warehouseId?: number
  warehouseName?: string
  totalQuantity?: number
  totalPrice?: number
  details?: ReceiptOrderDetailVO[]
  createTime?: Date
  creator?: string
  creatorName?: string
  updateTime?: Date
  updater?: string
  updaterName?: string
}

// WMS 入库单 API
export const ReceiptOrderApi = {
  // 查询入库单分页
  getReceiptOrderPage: async (params: any) => {
    return await request.get({ url: '/wms/receipt-order/page', params })
  },

  // 查询入库单详情
  getReceiptOrder: async (id: number) => {
    return await request.get({ url: '/wms/receipt-order/get?id=' + id })
  },

  // 查询入库单明细
  getReceiptOrderDetailListByOrderId: async (orderId: number) => {
    return await request.get({
      url: '/wms/receipt-order-detail/list-by-order-id?orderId=' + orderId
    })
  },

  // 新增入库单
  createReceiptOrder: async (data: ReceiptOrderVO) => {
    return await request.post({ url: '/wms/receipt-order/create', data })
  },

  // 修改入库单
  updateReceiptOrder: async (data: ReceiptOrderVO) => {
    return await request.put({ url: '/wms/receipt-order/update', data })
  },

  // 完成入库
  completeReceiptOrder: async (id: number) => {
    return await request.put({ url: '/wms/receipt-order/complete?id=' + id })
  },

  // 作废入库单
  cancelReceiptOrder: async (id: number) => {
    return await request.put({ url: '/wms/receipt-order/cancel?id=' + id })
  },

  // 删除入库单
  deleteReceiptOrder: async (id: number) => {
    return await request.delete({ url: '/wms/receipt-order/delete?id=' + id })
  },

  // 导出入库单
  exportReceiptOrder: async (params: any) => {
    return await request.download({ url: '/wms/receipt-order/export-excel', params })
  }
}
