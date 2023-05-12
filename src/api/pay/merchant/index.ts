import request from '@/config/axios'

export interface MerchantVO {
  id: number
  no: string
  name: string
  shortName: string
  status: number
  remark: string
  createTime: Date
}

export interface MerchantPageReqVO extends PageParam {
  no?: string
  name?: string
  shortName?: string
  status?: number
  remark?: string
  createTime?: Date[]
}

export interface MerchantExportReqVO {
  no?: string
  name?: string
  shortName?: string
  status?: number
  remark?: string
  createTime?: Date[]
}

// 查询列表支付商户
export const getMerchantPage = (params: MerchantPageReqVO) => {
  return request.get({ url: '/pay/merchant/page', params })
}

// 查询详情支付商户
export const getMerchant = (id: number) => {
  return request.get({ url: '/pay/merchant/get?id=' + id })
}

// 根据商户名称搜索商户列表
export const getMerchantListByName = (name?: string) => {
  return request.get({
    url: '/pay/merchant/list-by-name',
    params: {
      name: name
    }
  })
}

// 新增支付商户
export const createMerchant = (data: MerchantVO) => {
  return request.post({ url: '/pay/merchant/create', data })
}

// 修改支付商户
export const updateMerchant = (data: MerchantVO) => {
  return request.put({ url: '/pay/merchant/update', data })
}

// 删除支付商户
export const deleteMerchant = (id: number) => {
  return request.delete({ url: '/pay/merchant/delete?id=' + id })
}

// 导出支付商户
export const exportMerchant = (params: MerchantExportReqVO) => {
  return request.download({ url: '/pay/merchant/export-excel', params })
}

// 支付商户状态修改
export const updateMerchantStatus = (id: number, status: number) => {
  const data = {
    id,
    status
  }
  return request.put({ url: '/pay/merchant/update-status', data: data })
}
