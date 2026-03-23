import request from '@/config/axios'

// MES 领料出库单 VO
export interface WmProductIssueVO {
  id?: number
  code?: string
  name: string
  workstationId?: number
  workstationCode?: string
  workstationName?: string
  workOrderId?: number
  workOrderCode?: string
  requiredTime?: string
  status?: number
  remark?: string
  createTime?: string
}

// MES 领料出库单 API
export const WmProductIssueApi = {
  // 查询领料出库单分页
  getProductIssuePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/product-issue/page', params })
  },

  // 查询领料出库单详情
  getProductIssue: async (id: number) => {
    return await request.get({ url: '/mes/wm/product-issue/get?id=' + id })
  },

  // 新增领料出库单
  createProductIssue: async (data: WmProductIssueVO) => {
    return await request.post({ url: '/mes/wm/product-issue/create', data })
  },

  // 修改领料出库单
  updateProductIssue: async (data: WmProductIssueVO) => {
    return await request.put({ url: '/mes/wm/product-issue/update', data })
  },

  // 删除领料出库单
  deleteProductIssue: async (id: number) => {
    return await request.delete({ url: '/mes/wm/product-issue/delete?id=' + id })
  },

  // 提交领料出库单（进入审批流程）
  submitProductIssue: async (id: number) => {
    return await request.put({ url: '/mes/wm/product-issue/submit?id=' + id })
  },

  // 执行拣货
  stockProductIssue: async (id: number) => {
    return await request.put({ url: '/mes/wm/product-issue/stock?id=' + id })
  },

  // 取消领料出库单
  cancelProductIssue: async (id: number) => {
    return await request.put({ url: '/mes/wm/product-issue/cancel?id=' + id })
  },

  // 完成领料出库单（执行出库）
  finishProductIssue: async (id: number) => {
    return await request.put({ url: '/mes/wm/product-issue/finish?id=' + id })
  },

  // 校验领料出库单数量（每行明细数量之和是否等于行领料数量）
  checkProductIssueQuantity: async (id: number) => {
    return await request.get({ url: '/mes/wm/product-issue/check-quantity?id=' + id })
  },

  // 导出领料出库单 Excel
  exportProductIssue: async (params: any) => {
    return await request.download({ url: '/mes/wm/product-issue/export-excel', params })
  }
}
