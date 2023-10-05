import request from '@/config/axios'

export interface UserVO {
  id: number
  avatar: string | undefined
  birthday: number | undefined
  createTime: number | undefined
  loginDate: number | undefined
  loginIp: string
  mark: string
  mobile: string
  name: string | undefined
  nickname: string | undefined
  registerIp: string
  sex: number
  status: number
  areaId: number | undefined
  areaName: string | undefined
  levelName: string | null
  point: number | undefined | null
  totalPoint: number | undefined | null
  experience: number | null | undefined
}

// 查询会员用户列表
export const getUserPage = async (params) => {
  return await request.get({ url: `/member/user/page`, params })
}

// 查询会员用户详情
export const getUser = async (id: number) => {
  return await request.get({ url: `/member/user/get?id=` + id })
}

// 修改会员用户
export const updateUser = async (data: UserVO) => {
  return await request.put({ url: `/member/user/update`, data })
}

// 修改会员用户等级
export const updateUserLevel = async (data: any) => {
  return await request.put({ url: `/member/user/update-level`, data })
}

// 修改会员用户积分
export const updateUserPoint = async (data: any) => {
  return await request.put({ url: `/member/user/update-point`, data })
}

// 修改会员用户余额
export const updateUserBalance = async (data: any) => {
  return await request.put({ url: `/member/user/update-balance`, data })
}
