import request from '@/config/axios'
import { CheckOrderDetailVO } from './detail'

// WMS 盘库单 VO
export interface CheckOrderVO {
  id?: number
  no?: string
  orderTime?: string
  status?: number
  remark?: string
  warehouseId?: number
  warehouseName?: string
  totalQuantity?: number
  totalPrice?: number
  actualPrice?: number
  details?: CheckOrderDetailVO[]
  createTime?: Date
  creator?: string
  creatorName?: string
  updateTime?: Date
  updater?: string
  updaterName?: string
}

// WMS 盘库单 API
export const CheckOrderApi = {
  // 查询盘库单分页
  getCheckOrderPage: async (params: any) => {
    return await request.get({ url: '/wms/check-order/page', params })
  },

  // 查询盘库单详情
  getCheckOrder: async (id: number) => {
    return await request.get({ url: '/wms/check-order/get?id=' + id })
  },

  // 查询盘库单明细
  getCheckOrderDetailListByOrderId: async (orderId: number) => {
    return await request.get({
      url: '/wms/check-order-detail/list-by-order-id?orderId=' + orderId
    })
  },

  // 新增盘库单
  createCheckOrder: async (data: CheckOrderVO) => {
    return await request.post({ url: '/wms/check-order/create', data })
  },

  // 修改盘库单
  updateCheckOrder: async (data: CheckOrderVO) => {
    return await request.put({ url: '/wms/check-order/update', data })
  },

  // 完成盘库
  completeCheckOrder: async (id: number) => {
    return await request.put({ url: '/wms/check-order/complete?id=' + id })
  },

  // 作废盘库单
  cancelCheckOrder: async (id: number) => {
    return await request.put({ url: '/wms/check-order/cancel?id=' + id })
  },

  // 删除盘库单
  deleteCheckOrder: async (id: number) => {
    return await request.delete({ url: '/wms/check-order/delete?id=' + id })
  },

  // 导出盘库单
  exportCheckOrder: async (params: any) => {
    return await request.download({ url: '/wms/check-order/export-excel', params })
  }
}
