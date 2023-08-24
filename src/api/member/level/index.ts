import request from '@/config/axios'

export interface LevelVO {
  id: number
  name: string
  experience: number
  value: number
  discountPercent: number
  icon: string
  bgUrl: string
  status: number
}

// 查询会员等级列表
export const getLevelList = async (params) => {
  return await request.get({ url: `/member/level/list`, params })
}

// 查询会员等级详情
export const getLevel = async (id: number) => {
  return await request.get({ url: `/member/level/get?id=` + id })
}

// 查询会员等级 - 精简信息列表
export const getSimpleLevelList = async () => {
  return await request.get({ url: `/member/level/list-all-simple` })
}

// 新增会员等级
export const createLevel = async (data: LevelVO) => {
  return await request.post({ url: `/member/level/create`, data })
}

// 修改会员等级
export const updateLevel = async (data: LevelVO) => {
  return await request.put({ url: `/member/level/update`, data })
}

// 删除会员等级
export const deleteLevel = async (id: number) => {
  return await request.delete({ url: `/member/level/delete?id=` + id })
}
