import request from '@/config/axios'

// MES 杂项出库明细 VO
export interface WmMiscIssueDetailVO {
  id: number
  lineId: number
  issueId: number
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

// MES 杂项出库明细 API
export const WmMiscIssueDetailApi = {
  // 查询杂项出库明细分页
  getMiscIssueDetailPage: async (params: any) => {
    return await request.get({ url: '/mes/wm/misc-issue-detail/page', params })
  },

  // 根据行ID查询杂项出库明细列表
  getMiscIssueDetailListByLineId: async (lineId: number) => {
    return await request.get({ url: '/mes/wm/misc-issue-detail/list-by-line-id?lineId=' + lineId })
  },

  // 查询杂项出库明细详情
  getMiscIssueDetail: async (id: number) => {
    return await request.get({ url: '/mes/wm/misc-issue-detail/get?id=' + id })
  },

  // 新增杂项出库明细
  createMiscIssueDetail: async (data: WmMiscIssueDetailVO) => {
    return await request.post({ url: '/mes/wm/misc-issue-detail/create', data })
  },

  // 修改杂项出库明细
  updateMiscIssueDetail: async (data: WmMiscIssueDetailVO) => {
    return await request.put({ url: '/mes/wm/misc-issue-detail/update', data })
  },

  // 删除杂项出库明细
  deleteMiscIssueDetail: async (id: number) => {
    return await request.delete({ url: '/mes/wm/misc-issue-detail/delete?id=' + id })
  }
}
