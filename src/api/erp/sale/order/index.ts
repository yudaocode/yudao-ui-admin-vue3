import request from '@/config/axios'

// ERP 销售订单 VO
export interface SaleOrderVO {
  id: number // 订单工单编号
  no: string // 销售订单号
  customerId: number // 客户编号
  orderTime: Date // 订单时间
  totalCount: number // 合计数量
  totalPrice: number // 合计金额，单位：元
  status: number // 状态
  remark: string // 备注
  outCount: number // 销售出库数量
  returnCount: number // 销售退货数量
}

// ERP 销售订单 API
export const SaleOrderApi = {
  // 查询销售订单分页
  getSaleOrderPage: async (params: any) => {
    return await request.get({ url: `/erp/sale-order/page`, params })
  },

  // 查询销售订单详情
  getSaleOrder: async (id: number) => {
    return await request.get({ url: `/erp/sale-order/get?id=` + id })
  },

  // 新增销售订单
  createSaleOrder: async (data: SaleOrderVO) => {
    return await request.post({ url: `/erp/sale-order/create`, data })
  },

  // 修改销售订单
  updateSaleOrder: async (data: SaleOrderVO) => {
    return await request.put({ url: `/erp/sale-order/update`, data })
  },

  // 更新销售订单的状态
  updateSaleOrderStatus: async (id: number, status: number) => {
    return await request.put({
      url: `/erp/sale-order/update-status`,
      params: {
        id,
        status
      }
    })
  },

  // 删除销售订单
  deleteSaleOrder: async (ids: number[]) => {
    return await request.delete({
      url: `/erp/sale-order/delete`,
      params: {
        ids: ids.join(',')
      }
    })
  },

  // 导出销售订单 Excel
  exportSaleOrder: async (params: any) => {
    return await request.download({ url: `/erp/sale-order/export-excel`, params })
  }
}
