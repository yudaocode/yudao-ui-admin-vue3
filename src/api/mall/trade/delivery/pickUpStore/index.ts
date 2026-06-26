import request from '@/config/axios'
import type { UserVO } from '@/api/system/user'

export interface DeliveryPickUpStoreVO {
  id?: number
  name: string
  introduction: string
  phone: string
  areaId?: number
  detailAddress: string
  logo: string
  openingTime?: string
  closingTime?: string
  latitude?: number
  longitude?: number
  status: number
  verifyUserIds?: number[] // 绑定用户编号组数
  verifyUsers?: UserVO[] // 绑定用户列表
}

export interface DeliveryPickUpStoreBindReqVO {
  id: number
  verifyUserIds: number[]
}

// 查询自提门店列表
export const getDeliveryPickUpStorePage = async (params: any) => {
  return await request.get<PageResult<DeliveryPickUpStoreVO[]>>({
    url: '/trade/delivery/pick-up-store/page',
    params
  })
}

// 查询自提门店详情
export const getDeliveryPickUpStore = async (id: number) => {
  return await request.get<DeliveryPickUpStoreVO>({
    url: '/trade/delivery/pick-up-store/get?id=' + id
  })
}

// 查询自提门店精简列表
export const getSimpleDeliveryPickUpStoreList = async () => {
  return await request.get<DeliveryPickUpStoreVO[]>({
    url: '/trade/delivery/pick-up-store/simple-list'
  })
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

// 绑定自提店员
export const bindStoreStaffId = async (data: DeliveryPickUpStoreBindReqVO) => {
  return await request.post({ url: '/trade/delivery/pick-up-store/bind', data })
}
