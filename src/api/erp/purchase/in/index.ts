import request from '@/config/axios'

// ERP 采购入库 VO
export interface PurchaseInVO {
  id: number // 入库工单编号
  no: string // 采购入库号
  customerId: number // 客户编号
  inTime: Date // 入库时间
  totalCount: number // 合计数量
  totalPrice: number // 合计金额，单位：元
  status: number // 状态
  remark: string // 备注
  outCount: number // 采购出库数量
  returnCount: number // 采购退货数量
}

// ERP 采购入库 API
export const PurchaseInApi = {
  // 查询采购入库分页
  getPurchaseInPage: async (params: any) => {
    return await request.get({ url: `/erp/purchase-in/page`, params })
  },

  // 查询采购入库详情
  getPurchaseIn: async (id: number) => {
    return await request.get({ url: `/erp/purchase-in/get?id=` + id })
  },

  // 新增采购入库
  createPurchaseIn: async (data: PurchaseInVO) => {
    return await request.post({ url: `/erp/purchase-in/create`, data })
  },

  // 修改采购入库
  updatePurchaseIn: async (data: PurchaseInVO) => {
    return await request.put({ url: `/erp/purchase-in/update`, data })
  },

  // 更新采购入库的状态
  updatePurchaseInStatus: async (id: number, status: number) => {
    return await request.put({
      url: `/erp/purchase-in/update-status`,
      params: {
        id,
        status
      }
    })
  },

  // 删除采购入库
  deletePurchaseIn: async (ids: number[]) => {
    return await request.delete({
      url: `/erp/purchase-in/delete`,
      params: {
        ids: ids.join(',')
      }
    })
  },

  // 导出采购入库 Excel
  exportPurchaseIn: async (params: any) => {
    return await request.download({ url: `/erp/purchase-in/export-excel`, params })
  }
}
