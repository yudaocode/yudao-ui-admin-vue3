import request from '@/config/axios'

// ERP 销售退货 VO
export interface SaleReturnVO {
  id: number // 销售退货编号
  no: string // 销售退货号
  customerId: number // 客户编号
  returnTime: Date // 退货时间
  totalCount: number // 合计数量
  totalPrice: number // 合计金额，单位：元
  status: number // 状态
  remark: string // 备注
}

// ERP 销售退货 API
export const SaleReturnApi = {
  // 查询销售退货分页
  getSaleReturnPage: async (params: any) => {
    return await request.get({ url: `/erp/sale-return/page`, params })
  },

  // 查询销售退货详情
  getSaleReturn: async (id: number) => {
    return await request.get({ url: `/erp/sale-return/get?id=` + id })
  },

  // 新增销售退货
  createSaleReturn: async (data: SaleReturnVO) => {
    return await request.post({ url: `/erp/sale-return/create`, data })
  },

  // 修改销售退货
  updateSaleReturn: async (data: SaleReturnVO) => {
    return await request.put({ url: `/erp/sale-return/update`, data })
  },

  // 更新销售退货的状态
  updateSaleReturnStatus: async (id: number, status: number) => {
    return await request.put({
      url: `/erp/sale-return/update-status`,
      params: {
        id,
        status
      }
    })
  },

  // 删除销售退货
  deleteSaleReturn: async (ids: number[]) => {
    return await request.delete({
      url: `/erp/sale-return/delete`,
      params: {
        ids: ids.join(',')
      }
    })
  },

  // 导出销售退货 Excel
  exportSaleReturn: async (params: any) => {
    return await request.download({ url: `/erp/sale-return/export-excel`, params })
  }
}
