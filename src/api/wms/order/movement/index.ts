import request from '@/config/axios'
import { MovementOrderDetailVO } from './detail'

// WMS 移库单 VO
export interface MovementOrderVO {
  id?: number
  no?: string
  orderTime?: string
  status?: number
  remark?: string
  sourceWarehouseId?: number
  sourceWarehouseName?: string
  targetWarehouseId?: number
  targetWarehouseName?: string
  totalQuantity?: number
  totalPrice?: number
  details?: MovementOrderDetailVO[]
  createTime?: Date
  creator?: string
  creatorName?: string
  updateTime?: Date
  updater?: string
  updaterName?: string
}

// WMS 移库单 API
export const MovementOrderApi = {
  // 查询移库单分页
  getMovementOrderPage: async (params: any) => {
    return await request.get({ url: '/wms/movement-order/page', params })
  },

  // 查询移库单详情
  getMovementOrder: async (id: number) => {
    return await request.get({ url: '/wms/movement-order/get?id=' + id })
  },

  // 查询移库单明细
  getMovementOrderDetailListByOrderId: async (orderId: number) => {
    return await request.get({
      url: '/wms/movement-order-detail/list-by-order-id?orderId=' + orderId
    })
  },

  // 新增移库单
  createMovementOrder: async (data: MovementOrderVO) => {
    return await request.post({ url: '/wms/movement-order/create', data })
  },

  // 修改移库单
  updateMovementOrder: async (data: MovementOrderVO) => {
    return await request.put({ url: '/wms/movement-order/update', data })
  },

  // 完成移库
  completeMovementOrder: async (id: number) => {
    return await request.put({ url: '/wms/movement-order/complete?id=' + id })
  },

  // 作废移库单
  cancelMovementOrder: async (id: number) => {
    return await request.put({ url: '/wms/movement-order/cancel?id=' + id })
  },

  // 删除移库单
  deleteMovementOrder: async (id: number) => {
    return await request.delete({ url: '/wms/movement-order/delete?id=' + id })
  },

  // 导出移库单
  exportMovementOrder: async (params: any) => {
    return await request.download({ url: '/wms/movement-order/export-excel', params })
  }
}
