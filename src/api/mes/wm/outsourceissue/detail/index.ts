import request from '@/config/axios'

// MES 外协发料单明细 VO
export interface WmOutsourceIssueDetailVO {
  id: number
  lineId: number
  issueId: number
  materialStockId: number
  itemId: number
  itemCode: string
  itemName: string
  specification: string
  unitMeasureName: string
  quantity: number
  batchId: number
  batchCode: string
  warehouseId: number
  warehouseName: string
  locationId: number
  locationName: string
  areaId: number
  areaName: string
  remark: string
  createTime: string
}

// MES 外协发料单明细 API
export const WmOutsourceIssueDetailApi = {
  // 查询外协发料单明细列表（按行编号）
  getOutsourceIssueDetailListByLineId: async (lineId: number) => {
    return await request.get({ url: '/mes/wm/outsource-issue-detail/list-by-line', params: { lineId } })
  },

  // 查询外协发料单明细详情
  getOutsourceIssueDetail: async (id: number) => {
    return await request.get({ url: '/mes/wm/outsource-issue-detail/get?id=' + id })
  },

  // 新增外协发料单明细
  createOutsourceIssueDetail: async (data: WmOutsourceIssueDetailVO) => {
    return await request.post({ url: '/mes/wm/outsource-issue-detail/create', data })
  },

  // 修改外协发料单明细
  updateOutsourceIssueDetail: async (data: WmOutsourceIssueDetailVO) => {
    return await request.put({ url: '/mes/wm/outsource-issue-detail/update', data })
  },

  // 删除外协发料单明细
  deleteOutsourceIssueDetail: async (id: number) => {
    return await request.delete({ url: '/mes/wm/outsource-issue-detail/delete?id=' + id })
  }
}
