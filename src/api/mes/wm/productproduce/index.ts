import request from '@/config/axios'

// MES 生产入库单 VO
export interface WmProductProduceVO {
  id?: number
  workOrderId?: number
  workOrderCode?: string
  feedbackId?: number
  taskId?: number
  workstationId?: number
  workstationCode?: string
  workstationName?: string
  processId?: number
  processCode?: string
  processName?: string
  produceDate?: string
  status?: number
  remark?: string
  createTime?: string
}

// MES 生产入库单 API
export const WmProductProduceApi = {
  // 查询生产入库单分页
  getProductProducePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/product-produce/page', params })
  },

  // 查询生产入库单详情
  getProductProduce: async (id: number) => {
    return await request.get({ url: '/mes/wm/product-produce/get?id=' + id })
  },

  // 新增生产入库单
  createProductProduce: async (data: WmProductProduceVO) => {
    return await request.post({ url: '/mes/wm/product-produce/create', data })
  },

  // 修改生产入库单
  updateProductProduce: async (data: WmProductProduceVO) => {
    return await request.put({ url: '/mes/wm/product-produce/update', data })
  },

  // 删除生产入库单
  deleteProductProduce: async (id: number) => {
    return await request.delete({ url: '/mes/wm/product-produce/delete?id=' + id })
  },

  // 完成生产入库单（执行入库）
  finishProductProduce: async (id: number) => {
    return await request.put({ url: '/mes/wm/product-produce/finish?id=' + id })
  },

  // 取消生产入库单
  cancelProductProduce: async (id: number) => {
    return await request.put({ url: '/mes/wm/product-produce/cancel?id=' + id })
  },

  // 校验生产入库单数量（每行明细数量之和是否等于行入库数量）
  checkProductProduceQuantity: async (id: number) => {
    return await request.get({ url: '/mes/wm/product-produce/check-quantity?id=' + id })
  },

  // 导出生产入库单 Excel
  exportProductProduceExcel: async (params: any) => {
    return await request.download({ url: '/mes/wm/product-produce/export-excel', params })
  }
}
