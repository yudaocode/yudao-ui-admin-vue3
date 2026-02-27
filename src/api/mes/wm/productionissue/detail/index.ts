import request from '@/config/axios'

// MES 领料出库明细 VO
export interface WmProductionIssueDetailVO {
  id?: number
  issueId: number
  lineId: number
  materialStockId: number
  itemId: number
  quantity: number
  batchId?: number
  batchCode?: string
  warehouseId: number
  warehouseName?: string
  locationId?: number
  locationName?: string
  areaId?: number
  areaName?: string
  remark?: string
}

// MES 领料出库明细 API
export const WmProductionIssueDetailApi = {
  // 查询领料出库明细分页
  getDetailPage: async (params: any) => {
    return await request.get({ url: '/mes/wm/production-issue-detail/page', params })
  },

  // 查询领料出库明细详情
  getDetail: async (id: number) => {
    return await request.get({ url: '/mes/wm/production-issue-detail/get?id=' + id })
  },

  // 新增领料出库明细
  createDetail: async (data: WmProductionIssueDetailVO) => {
    return await request.post({ url: '/mes/wm/production-issue-detail/create', data })
  },

  // 修改领料出库明细
  updateDetail: async (data: WmProductionIssueDetailVO) => {
    return await request.put({ url: '/mes/wm/production-issue-detail/update', data })
  },

  // 删除领料出库明细
  deleteDetail: async (id: number) => {
    return await request.delete({ url: '/mes/wm/production-issue-detail/delete?id=' + id })
  }
}
