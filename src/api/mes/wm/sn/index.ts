import request from '@/config/axios'

export interface WmSnGroupVO {
  uuid?: string
  count?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  batchCode?: string
  workOrderId?: number
  createTime?: Date
}

export interface WmSnGenerateVO {
  itemId?: number
  batchCode?: string
  workOrderId?: number
  count?: number
}

// 生成 SN 码
export const generateSnCodes = async (data: WmSnGenerateVO) => {
  return await request.post({ url: `/mes/wm/sn/generate`, data })
}

// 获得 SN 码分组分页
export const getSnGroupPage = async (params: any) => {
  return await request.get({ url: `/mes/wm/sn/group-page`, params })
}

// 批量删除 SN 码（按批次 UUID）
export const deleteSnBatch = async (uuid: string) => {
  return await request.delete({ url: `/mes/wm/sn/delete-batch`, params: { uuid } })
}

// 导出 SN 码分组 Excel
export const exportSnGroupExcel = async (params: any) => {
  return await request.download({ url: `/mes/wm/sn/group-export-excel`, params })
}

// 导出批次 SN 码明细 Excel
export const exportSnDetailExcel = async (uuid: string) => {
  return await request.download({ url: `/mes/wm/sn/export-excel`, params: { uuid } })
}
