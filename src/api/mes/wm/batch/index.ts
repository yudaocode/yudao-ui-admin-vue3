import request from '@/config/axios'

export interface BatchVO {
  id: number
  code: string
  itemId: number
  itemCode?: string
  itemName?: string
  itemSpecification?: string
  unitName?: string
  produceDate?: Date
  expireDate?: Date
  receiptDate?: Date
  vendorId?: number
  vendorCode?: string
  vendorName?: string
  clientId?: number
  clientCode?: string
  clientName?: string
  purchaseOrderCode?: string
  salesOrderCode?: string
  workOrderId?: number
  workOrderCode?: string
  taskId?: number
  workstationId?: number
  workstationCode?: string
  toolId?: number
  moldId?: number
  lotNumber?: string
  qualityStatus?: string
  remark?: string
  createTime?: Date
}

// 批次追溯 API
export const BatchApi = {
  // 获取批次详情
  getBatch: async (id: number) => {
    return await request.get({ url: `/mes/wm/batch/get?id=` + id })
  },

  // 获取批次分页
  getBatchPage: async (params: PageParam) => {
    return await request.get({ url: `/mes/wm/batch/page`, params })
  },

  // 向前追溯
  getForwardList: async (code: string) => {
    return await request.get({ url: `/mes/wm/batch/forward-list`, params: { code } })
  },

  // 向后追溯
  getBackwardList: async (code: string) => {
    return await request.get({ url: `/mes/wm/batch/backward-list`, params: { code } })
  }
}
