import request from '@/config/axios'

export interface AppVO {
  id: number
  appKey: string
  name: string
  status: number
  remark: string
  payNotifyUrl: string
  refundNotifyUrl: string
  merchantId: number
  merchantName: string
  createTime: Date
}

export interface AppPageReqVO extends PageParam {
  name?: string
  status?: number
  remark?: string
  payNotifyUrl?: string
  refundNotifyUrl?: string
  merchantName?: string
  createTime?: Date[]
}

export interface AppUpdateStatusReqVO {
  id: number
  status: number
}

// 查询列表支付应用
export const getAppPage = (params: AppPageReqVO) => {
  return request.get({ url: '/pay/app/page', params })
}

// 查询详情支付应用
export const getApp = (id: number) => {
  return request.get({ url: '/pay/app/get?id=' + id })
}

// 新增支付应用
export const createApp = (data: AppVO) => {
  return request.post({ url: '/pay/app/create', data })
}

// 修改支付应用
export const updateApp = (data: AppVO) => {
  return request.put({ url: '/pay/app/update', data })
}

// 支付应用信息状态修改
export const changeAppStatus = (data: AppUpdateStatusReqVO) => {
  return request.put({ url: '/pay/app/update-status', data: data })
}

// 删除支付应用
export const deleteApp = (id: number) => {
  return request.delete({ url: '/pay/app/delete?id=' + id })
}

// 获得支付应用列表
export const getAppList = () => {
  return request.get({
    url: '/pay/app/list'
  })
}
