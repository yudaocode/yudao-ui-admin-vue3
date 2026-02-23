import request from '@/config/axios'

// MES 待检任务 VO
export interface QcPendingInspectVO {
  sourceDocId: number
  sourceDocType: number
  sourceDocCode: string
  sourceLineId: number
  qcType: number
  qcTypeName: string
  itemId: number
  itemCode: string
  itemName: string
  specification: string
  unitName: string
  quantityToCheck: number
  vendorId: number
  vendorName: string
  recordTime: string
}

// MES 待检任务 API
export const QcPendingInspectApi = {
  // 查询待检任务分页
  getPendingInspectPage: async (params: any) => {
    return await request.get({ url: '/mes/qc/pending-inspect/page', params })
  }
}
