import request from '@/config/axios'

export interface DeliveryExpressTemplateVO {
  id: number
  name: string
  chargeMode: number
  sort: number
  templateCharge: ExpressTemplateChargeVO[]
  templateFree: ExpressTemplateFreeVO[]
}

export declare type ExpressTemplateChargeVO = {
  areaIds: number[]
  startCount: number
  startPrice: number
  extraCount: number
  extraPrice: number
}

export declare type ExpressTemplateFreeVO = {
  areaIds: number[]
  freeCount: number
  freePrice: number
}

// 查询快递运费模板列表
export const getDeliveryExpressTemplatePage = async (params: PageParam) => {
  return await request.get({ url: '/trade/delivery/express-template/page', params })
}

// 查询快递运费模板详情
export const getDeliveryExpressTemplate = async (id: number) => {
  return await request.get({ url: '/trade/delivery/express-template/get?id=' + id })
}

// 查询快递运费模板详情
export const getSimpleTemplateList = async () => {
  return await request.get({ url: '/trade/delivery/express-template/list-all-simple' })
}

// 新增快递运费模板
export const createDeliveryExpressTemplate = async (data: DeliveryExpressTemplateVO) => {
  return await request.post({ url: '/trade/delivery/express-template/create', data })
}

// 修改快递运费模板
export const updateDeliveryExpressTemplate = async (data: DeliveryExpressTemplateVO) => {
  return await request.put({ url: '/trade/delivery/express-template/update', data })
}

// 删除快递运费模板
export const deleteDeliveryExpressTemplate = async (id: number) => {
  return await request.delete({ url: '/trade/delivery/express-template/delete?id=' + id })
}
