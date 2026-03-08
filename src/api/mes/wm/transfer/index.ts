import request from '@/config/axios'

// MES 转移单 VO
export interface WmTransferVO {
  id: number
  code: string
  name: string
  type: number
  deliveryFlag: boolean
  recipientName: string
  recipientTelephone: string
  destinationAddress: string
  carrier: string
  shippingNumber: string
  confirmFlag: boolean
  transferDate: string
  status: number
  remark: string
  createTime?: string
}

// MES 转移单 API
export const WmTransferApi = {
  // 查询转移单分页
  getTransferPage: async (params: any) => {
    return await request.get({ url: '/mes/wm/transfer/page', params })
  },

  // 查询转移单详情
  getTransfer: async (id: number) => {
    return await request.get({ url: '/mes/wm/transfer/get?id=' + id })
  },

  // 新增转移单
  createTransfer: async (data: WmTransferVO) => {
    return await request.post({ url: '/mes/wm/transfer/create', data })
  },

  // 修改转移单
  updateTransfer: async (data: WmTransferVO) => {
    return await request.put({ url: '/mes/wm/transfer/update', data })
  },

  // 删除转移单
  deleteTransfer: async (id: number) => {
    return await request.delete({ url: '/mes/wm/transfer/delete?id=' + id })
  },

  // 提交转移单
  submitTransfer: async (id: number) => {
    return await request.put({ url: '/mes/wm/transfer/submit?id=' + id })
  },

  // 到货确认
  confirmTransfer: async (id: number) => {
    return await request.put({ url: '/mes/wm/transfer/confirm?id=' + id })
  },

  // 执行上架
  stockTransfer: async (id: number) => {
    return await request.put({ url: '/mes/wm/transfer/stock?id=' + id })
  },

  // 完成转移
  finishTransfer: async (id: number) => {
    return await request.put({ url: '/mes/wm/transfer/finish?id=' + id })
  },

  // 取消转移单
  cancelTransfer: async (id: number) => {
    return await request.put({ url: '/mes/wm/transfer/cancel?id=' + id })
  },

  // 导出转移单 Excel
  exportTransfer: async (params: any) => {
    return await request.download({ url: '/mes/wm/transfer/export-excel', params })
  }
}