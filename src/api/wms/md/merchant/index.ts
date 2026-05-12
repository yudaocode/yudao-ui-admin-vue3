import request from '@/config/axios'

// WMS 往来企业 VO
export interface MerchantVO {
  id?: number
  code?: string
  name?: string
  type?: number
  level?: string
  bankName?: string
  bankAccount?: string
  address?: string
  mobile?: string
  telephone?: string
  contact?: string
  email?: string
  remark?: string
  createTime?: Date
}

export interface MerchantSimpleListReqVO {
  types?: number[]
}

// WMS 往来企业 API
export const MerchantApi = {
  // 查询往来企业分页
  getMerchantPage: async (params: any) => {
    return await request.get({ url: '/wms/merchant/page', params })
  },

  // 查询往来企业精简列表
  getMerchantSimpleList: async (params?: MerchantSimpleListReqVO) => {
    return await request.get({ url: '/wms/merchant/simple-list', params })
  },

  // 查询往来企业详情
  getMerchant: async (id: number) => {
    return await request.get({ url: '/wms/merchant/get?id=' + id })
  },

  // 新增往来企业
  createMerchant: async (data: MerchantVO) => {
    return await request.post({ url: '/wms/merchant/create', data })
  },

  // 修改往来企业
  updateMerchant: async (data: MerchantVO) => {
    return await request.put({ url: '/wms/merchant/update', data })
  },

  // 删除往来企业
  deleteMerchant: async (id: number) => {
    return await request.delete({ url: '/wms/merchant/delete?id=' + id })
  },

  // 导出往来企业
  exportMerchant: async (params: any) => {
    return await request.download({ url: '/wms/merchant/export-excel', params })
  }
}
