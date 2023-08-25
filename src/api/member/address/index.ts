import request from '@/config/axios'

export interface AddressVO {
  id: number
  name: string
  mobile: string
  areaId: number
  detailAddress: string
  defaultStatus: boolean
}

// 查询用户收件地址列表
export const getAddressPage = async (params) => {
  return await request.get({ url: `/member/address/page`, params })
}

// 查询用户收件地址详情
export const getAddress = async (id: number) => {
  return await request.get({ url: `/member/address/get?id=` + id })
}

// 新增用户收件地址
export const createAddress = async (data: AddressVO) => {
  return await request.post({ url: `/member/address/create`, data })
}

// 修改用户收件地址
export const updateAddress = async (data: AddressVO) => {
  return await request.put({ url: `/member/address/update`, data })
}

// 删除用户收件地址
export const deleteAddress = async (id: number) => {
  return await request.delete({ url: `/member/address/delete?id=` + id })
}

// 导出用户收件地址 Excel
export const exportAddress = async (params) => {
  return await request.download({ url: `/member/address/export-excel`, params })
}
