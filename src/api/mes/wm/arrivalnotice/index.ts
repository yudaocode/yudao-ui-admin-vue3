import request from '@/config/axios'

// MES 到货通知单 VO
export interface WmArrivalNoticeVO {
  id: number
  code: string
  name: string
  purchaseOrderCode: string
  vendorId: number
  vendorCode: string
  vendorName: string
  arrivalDate: string
  contactName: string
  contactTelephone: string
  status: number
  remark: string
  createTime: string
}

// MES 到货通知单 API
export const WmArrivalNoticeApi = {
  // 查询到货通知单分页
  getArrivalNoticePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/arrival-notice/page', params })
  },

  // 查询到货通知单详情
  getArrivalNotice: async (id: number) => {
    return await request.get({ url: '/mes/wm/arrival-notice/get?id=' + id })
  },

  // 新增到货通知单
  createArrivalNotice: async (data: WmArrivalNoticeVO) => {
    return await request.post({ url: '/mes/wm/arrival-notice/create', data })
  },

  // 修改到货通知单
  updateArrivalNotice: async (data: WmArrivalNoticeVO) => {
    return await request.put({ url: '/mes/wm/arrival-notice/update', data })
  },

  // 删除到货通知单
  deleteArrivalNotice: async (id: number) => {
    return await request.delete({ url: '/mes/wm/arrival-notice/delete?id=' + id })
  },

  // 提交到货通知单
  submitArrivalNotice: async (id: number) => {
    return await request.put({ url: '/mes/wm/arrival-notice/submit?id=' + id })
  },

  // 导出到货通知单 Excel
  exportArrivalNotice: async (params: any) => {
    return await request.download({ url: '/mes/wm/arrival-notice/export-excel', params })
  },

  // 获得到货通知单精简列表（可按状态筛选）
  getArrivalNoticeSimpleList: async (status?: number) => {
    return await request.get({ url: '/mes/wm/arrival-notice/simple-list', params: { status } })
  }
}
