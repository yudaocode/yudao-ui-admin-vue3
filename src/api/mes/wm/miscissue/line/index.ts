import request from '@/config/axios'

// MES 杂项出库单行 VO
export interface WmMiscIssueLineVO {
  id: number
  issueId: number
  sourceDocLineId: number
  materialStockId: number
  itemId: number
  itemCode: string
  itemName: string
  specification: string
  unitMeasure: string
  unitMeasureName: string
  quantity: number
  batchId: number
  batchCode: string
  warehouseId: number
  warehouseCode: string
  warehouseName: string
  locationId: number
  locationCode: string
  locationName: string
  areaId: number
  areaCode: string
  areaName: string
  remark: string
}

// MES 杂项出库单行 API
export const WmMiscIssueLineApi = {
  // 查询杂项出库单行分页
  getMiscIssueLinePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/misc-issue-line/page', params })
  },

  // 根据出库单ID查询杂项出库单行列表
  getMiscIssueLineListByIssueId: async (issueId: number) => {
    return await request.get({ url: '/mes/wm/misc-issue-line/list-by-issue-id?issueId=' + issueId })
  },

  // 查询杂项出库单行详情
  getMiscIssueLine: async (id: number) => {
    return await request.get({ url: '/mes/wm/misc-issue-line/get?id=' + id })
  },

  // 新增杂项出库单行
  createMiscIssueLine: async (data: WmMiscIssueLineVO) => {
    return await request.post({ url: '/mes/wm/misc-issue-line/create', data })
  },

  // 修改杂项出库单行
  updateMiscIssueLine: async (data: WmMiscIssueLineVO) => {
    return await request.put({ url: '/mes/wm/misc-issue-line/update', data })
  },

  // 删除杂项出库单行
  deleteMiscIssueLine: async (id: number) => {
    return await request.delete({ url: '/mes/wm/misc-issue-line/delete?id=' + id })
  }
}
