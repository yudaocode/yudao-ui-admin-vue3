import request from '@/config/axios'

// ERP 付款单 VO
export interface FinancePaymentVO {
  id: number // 付款单编号
  no: string // 付款单号
  supplierId: number // 供应商编号
  paymentTime: Date // 付款时间
  totalPrice: number // 合计金额，单位：元
  status: number // 状态
  remark: string // 备注
}

// ERP 付款单 API
export const FinancePaymentApi = {
  // 查询付款单分页
  getFinancePaymentPage: async (params: any) => {
    return await request.get({ url: `/erp/finance-payment/page`, params })
  },

  // 查询付款单详情
  getFinancePayment: async (id: number) => {
    return await request.get({ url: `/erp/finance-payment/get?id=` + id })
  },

  // 新增付款单
  createFinancePayment: async (data: FinancePaymentVO) => {
    return await request.post({ url: `/erp/finance-payment/create`, data })
  },

  // 修改付款单
  updateFinancePayment: async (data: FinancePaymentVO) => {
    return await request.put({ url: `/erp/finance-payment/update`, data })
  },

  // 更新付款单的状态
  updateFinancePaymentStatus: async (id: number, status: number) => {
    return await request.put({
      url: `/erp/finance-payment/update-status`,
      params: {
        id,
        status
      }
    })
  },

  // 删除付款单
  deleteFinancePayment: async (ids: number[]) => {
    return await request.delete({
      url: `/erp/finance-payment/delete`,
      params: {
        ids: ids.join(',')
      }
    })
  },

  // 导出付款单 Excel
  exportFinancePayment: async (params: any) => {
    return await request.download({ url: `/erp/finance-payment/export-excel`, params })
  }
}
