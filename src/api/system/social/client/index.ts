import request from '@/config/axios'

export interface SocialClientVO {
  id: number
  name: string
  socialType: number
  userType: number
  clientId: string
  clientSecret: string
  agentId: string
  status: number
}

// 查询社交客户端列表
export const getSocialClientPage = async (params) => {
  return await request.get({ url: `/system/social-client/page`, params })
}

// 查询社交客户端详情
export const getSocialClient = async (id: number) => {
  return await request.get({ url: `/system/social-client/get?id=` + id })
}

// 新增社交客户端
export const createSocialClient = async (data: SocialClientVO) => {
  return await request.post({ url: `/system/social-client/create`, data })
}

// 修改社交客户端
export const updateSocialClient = async (data: SocialClientVO) => {
  return await request.put({ url: `/system/social-client/update`, data })
}

// 删除社交客户端
export const deleteSocialClient = async (id: number) => {
  return await request.delete({ url: `/system/social-client/delete?id=` + id })
}
