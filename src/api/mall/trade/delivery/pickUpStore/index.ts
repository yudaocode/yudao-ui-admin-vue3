import request from '@/config/axios'

export interface DeliveryPickUpStoreVO {
  id: number
  name: string
  introduction: string
  phone: string
  areaId: number
  detailAddress: string
  logo: string
  openingTime: string
  closingTime: string
  latitude: number
  longitude: number
  status: number
}

// 查询自提门店列表
export const getDeliveryPickUpStorePage = async (params: DeliveryPickUpStorePageReqVO) => {
  return await request.get({ url: '/trade/delivery/pick-up-store/page', params })
}

// 查询自提门店详情
export const getDeliveryPickUpStore = async (id: number) => {
  return await request.get({ url: '/trade/delivery/pick-up-store/get?id=' + id })
}

// 新增自提门店
export const createDeliveryPickUpStore = async (data: DeliveryPickUpStoreVO) => {
  return await request.post({ url: '/trade/delivery/pick-up-store/create', data })
}

// 修改自提门店
export const updateDeliveryPickUpStore = async (data: DeliveryPickUpStoreVO) => {
  return await request.put({ url: '/trade/delivery/pick-up-store/update', data })
}

// 删除自提门店
export const deleteDeliveryPickUpStore = async (id: number) => {
  return await request.delete({ url: '/trade/delivery/pick-up-store/delete?id=' + id })
}

// 导出自提门店 Excel
export const exportDeliveryPickUpStoreApi = async (params) => {
  return await request.download({ url: '/trade/delivery/pick-up-store/export-excel', params })
}
