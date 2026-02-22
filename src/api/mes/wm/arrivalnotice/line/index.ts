import request from '@/config/axios'

// MES 到货通知单行 VO
export interface WmArrivalNoticeLineVO {
  id: number
  noticeId: number
  itemId: number
  itemCode: string
  itemName: string
  specification: string
  unitMeasureName: string
  arrivalQuantity: number
  qualifiedQuantity: number
  iqcCheckFlag: boolean
  iqcId: number
  iqcCode: string
  remark: string
  createTime: string
}

// MES 到货通知单行 API
export const WmArrivalNoticeLineApi = {
  // 查询到货通知单行分页
  getArrivalNoticeLinePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/arrival-notice-line/page', params })
  },

  // 查询到货通知单行详情
  getArrivalNoticeLine: async (id: number) => {
    return await request.get({ url: '/mes/wm/arrival-notice-line/get?id=' + id })
  },

  // 新增到货通知单行
  createArrivalNoticeLine: async (data: WmArrivalNoticeLineVO) => {
    return await request.post({ url: '/mes/wm/arrival-notice-line/create', data })
  },

  // 修改到货通知单行
  updateArrivalNoticeLine: async (data: WmArrivalNoticeLineVO) => {
    return await request.put({ url: '/mes/wm/arrival-notice-line/update', data })
  },

  // 删除到货通知单行
  deleteArrivalNoticeLine: async (id: number) => {
    return await request.delete({ url: '/mes/wm/arrival-notice-line/delete?id=' + id })
  }
}
