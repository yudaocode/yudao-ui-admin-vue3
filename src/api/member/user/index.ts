import request from '@/config/axios'

export interface UserVO {
  id?: number
  avatar?: string
  birthday?: number
  createTime?: number
  loginDate?: number
  loginIp?: string
  mark?: string
  mobile?: string
  email?: string
  password?: string
  name?: string
  nickname?: string
  registerIp?: string
  sex?: number
  status?: number
  areaId?: number
  areaName?: string
  tagIds?: number[]
  groupId?: number
  levelId?: number
  levelName?: string | null
  point?: number | null
  totalPoint?: number | null
  experience?: number | null
}

export interface UserLevelUpdateReqVO {
  id: number
  levelId: number
  reason: string
}

export interface UserPointUpdateReqVO {
  id: number
  point: number
}

// 查询会员用户列表
export const getUserPage = async (params) => {
  return await request.get<PageResult<UserVO[]>>({ url: `/member/user/page`, params })
}

// 查询会员用户详情
export const getUser = async (id: number) => {
  return await request.get<UserVO>({ url: `/member/user/get?id=` + id })
}

// 修改会员用户
export const updateUser = async (data: UserVO) => {
  return await request.put({ url: `/member/user/update`, data })
}

// 修改会员用户等级
export const updateUserLevel = async (data: UserLevelUpdateReqVO) => {
  return await request.put({ url: `/member/user/update-level`, data })
}

// 修改会员用户积分
export const updateUserPoint = async (data: UserPointUpdateReqVO) => {
  return await request.put({ url: `/member/user/update-point`, data })
}
