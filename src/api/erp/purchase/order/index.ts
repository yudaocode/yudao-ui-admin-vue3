import request from '@/config/axios'

// ERP 采购订单 VO
export interface PurchaseOrderVO {
  id: number // 订单工单编号
  no: string // 采购订单号
  customerId: number // 客户编号
  orderTime: Date // 订单时间
  totalCount: number // 合计数量
  totalPrice: number // 合计金额，单位：元
  status: number // 状态
  remark: string // 备注
  outCount: number // 采购出库数量
  returnCount: number // 采购退货数量
}

// ERP 采购订单 API
export const PurchaseOrderApi = {
  // 查询采购订单分页
  getPurchaseOrderPage: async (params: any) => {
    return await request.get({ url: `/erp/purchase-order/page`, params })
  },

  // 查询采购订单详情
  getPurchaseOrder: async (id: number) => {
    return await request.get({ url: `/erp/purchase-order/get?id=` + id })
  },

  // 新增采购订单
  createPurchaseOrder: async (data: PurchaseOrderVO) => {
    return await request.post({ url: `/erp/purchase-order/create`, data })
  },

  // 修改采购订单
  updatePurchaseOrder: async (data: PurchaseOrderVO) => {
    return await request.put({ url: `/erp/purchase-order/update`, data })
  },

  // 更新采购订单的状态
  updatePurchaseOrderStatus: async (id: number, status: number) => {
    return await request.put({
      url: `/erp/purchase-order/update-status`,
      params: {
        id,
        status
      }
    })
  },

  // 删除采购订单
  deletePurchaseOrder: async (ids: number[]) => {
    return await request.delete({
      url: `/erp/purchase-order/delete`,
      params: {
        ids: ids.join(',')
      }
    })
  },

  // 导出采购订单 Excel
  exportPurchaseOrder: async (params: any) => {
    return await request.download({ url: `/erp/purchase-order/export-excel`, params })
  }
}
