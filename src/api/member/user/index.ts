import request from '@/config/axios'

export interface UserVO {
  areaId: number | undefined
  areaName: string | undefined
  avatar: string | undefined
  birthday: number | undefined
  createTime: number | undefined
  id: number
  loginDate: number | undefined
  loginIp: string
  mark: string
  mobile: string
  name: string | undefined
  nickname: string | undefined
  registerIp: string
  sex: number
  status: number
}

// TODO @梦：和 UserVO 搞成一个把。
export interface UserBaseInfoVO {
  id: number | undefined | null
  mobile: string
  password: string | null | undefined
  status: number
  registerIp: string | null | undefined
  loginIp: string | null | undefined
  loginDate: Date | null | undefined
  nickname: string | null | undefined
  avatar: string | null | undefined
  name: string | null | undefined
  sex: number
  areaId: number | null | undefined
  areaName: string | null | undefined
  birthday: Date | null | undefined
  mark: string | null | undefined
  createTime: Date | null | undefined
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
