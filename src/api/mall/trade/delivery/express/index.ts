import request from '@/config/axios'

export interface DeliveryExpressVO {
  id: number
  code: string
  name: string
  logo: string
  sort: number
  status: number
}

// 查询快递公司列表
export const getDeliveryExpressPage = async (params: PageParam) => {
  return await request.get({ url: '/trade/delivery/express/page', params })
}

// 查询快递公司详情
export const getDeliveryExpress = async (id: number) => {
  return await request.get({ url: '/trade/delivery/express/get?id=' + id })
}

// 获得快递公司精简信息列表
export const getSimpleDeliveryExpressList = () => {
  return request.get({ url: '/trade/delivery/express/list-all-simple' })
}

// 新增快递公司
export const createDeliveryExpress = async (data: DeliveryExpressVO) => {
  return await request.post({ url: '/trade/delivery/express/create', data })
}

// 修改快递公司
export const updateDeliveryExpress = async (data: DeliveryExpressVO) => {
  return await request.put({ url: '/trade/delivery/express/update', data })
}

// 删除快递公司
export const deleteDeliveryExpress = async (id: number) => {
  return await request.delete({ url: '/trade/delivery/express/delete?id=' + id })
}

// 导出快递公司 Excel
export const exportDeliveryExpressApi = async (params) => {
  return await request.download({ url: '/trade/delivery/express/export-excel', params })
}
