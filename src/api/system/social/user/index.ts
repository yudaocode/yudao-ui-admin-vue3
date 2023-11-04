import request from '@/config/axios'

export interface SocialUserVO {
  id: number
  type: number
  openid: string
  token: string
  rawTokenInfo: string
  nickname: string
  avatar: string
  rawUserInfo: string
  code: string
  state: string
}

// 查询社交用户列表
export const getSocialUserPage = async (params) => {
  return await request.get({ url: `/system/social-user/page`, params })
}

// 查询社交用户详情
export const getSocialUser = async (id: number) => {
  return await request.get({ url: `/system/social-user/get?id=` + id })
}

// 修改社交用户
export const updateSocialUser = async (data: SocialUserVO) => {
  return await request.put({ url: `/system/social-user/update`, data })
}

// 删除社交用户
export const deleteSocialUser = async (id: number) => {
  return await request.delete({ url: `/system/social-user/delete?id=` + id })
}
