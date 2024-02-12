import request from '@/config/axios'

// ERP 采购退货 VO
export interface PurchaseReturnVO {
  id: number // 采购退货编号
  no: string // 采购退货号
  customerId: number // 客户编号
  returnTime: Date // 退货时间
  totalCount: number // 合计数量
  totalPrice: number // 合计金额，单位：元
  status: number // 状态
  remark: string // 备注
}

// ERP 采购退货 API
export const PurchaseReturnApi = {
  // 查询采购退货分页
  getPurchaseReturnPage: async (params: any) => {
    return await request.get({ url: `/erp/purchase-return/page`, params })
  },

  // 查询采购退货详情
  getPurchaseReturn: async (id: number) => {
    return await request.get({ url: `/erp/purchase-return/get?id=` + id })
  },

  // 新增采购退货
  createPurchaseReturn: async (data: PurchaseReturnVO) => {
    return await request.post({ url: `/erp/purchase-return/create`, data })
  },

  // 修改采购退货
  updatePurchaseReturn: async (data: PurchaseReturnVO) => {
    return await request.put({ url: `/erp/purchase-return/update`, data })
  },

  // 更新采购退货的状态
  updatePurchaseReturnStatus: async (id: number, status: number) => {
    return await request.put({
      url: `/erp/purchase-return/update-status`,
      params: {
        id,
        status
      }
    })
  },

  // 删除采购退货
  deletePurchaseReturn: async (ids: number[]) => {
    return await request.delete({
      url: `/erp/purchase-return/delete`,
      params: {
        ids: ids.join(',')
      }
    })
  },

  // 导出采购退货 Excel
  exportPurchaseReturn: async (params: any) => {
    return await request.download({ url: `/erp/purchase-return/export-excel`, params })
  }
}
