import request from '@/config/axios'
import { ShipmentOrderDetailVO } from './detail'

// WMS 出库单 VO
export interface ShipmentOrderVO {
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
  details?: ShipmentOrderDetailVO[]
  createTime?: Date
  creator?: string
  creatorName?: string
  updateTime?: Date
  updater?: string
  updaterName?: string
}

// WMS 出库单 API
export const ShipmentOrderApi = {
  // 查询出库单分页
  getShipmentOrderPage: async (params: any) => {
    return await request.get({ url: '/wms/shipment-order/page', params })
  },

  // 查询出库单详情
  getShipmentOrder: async (id: number) => {
    return await request.get({ url: '/wms/shipment-order/get?id=' + id })
  },

  // 查询出库单明细
  getShipmentOrderDetailListByOrderId: async (orderId: number) => {
    return await request.get({
      url: '/wms/shipment-order-detail/list-by-order-id?orderId=' + orderId
    })
  },

  // 新增出库单
  createShipmentOrder: async (data: ShipmentOrderVO) => {
    return await request.post({ url: '/wms/shipment-order/create', data })
  },

  // 修改出库单
  updateShipmentOrder: async (data: ShipmentOrderVO) => {
    return await request.put({ url: '/wms/shipment-order/update', data })
  },

  // 完成出库
  completeShipmentOrder: async (id: number) => {
    return await request.put({ url: '/wms/shipment-order/complete?id=' + id })
  },

  // 作废出库单
  cancelShipmentOrder: async (id: number) => {
    return await request.put({ url: '/wms/shipment-order/cancel?id=' + id })
  },

  // 删除出库单
  deleteShipmentOrder: async (id: number) => {
    return await request.delete({ url: '/wms/shipment-order/delete?id=' + id })
  },

  // 导出出库单
  exportShipmentOrder: async (params: any) => {
    return await request.download({ url: '/wms/shipment-order/export-excel', params })
  }
}
