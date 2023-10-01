import request from '@/config/axios'

export interface SignInConfigVO {
  id?: number
  day?: number
  point?: number
  experience?: number
  status?: number
}

// 查询积分签到规则列表
export const getSignInConfigList = async () => {
  return await request.get({ url: `/member/sign-in/config/list` })
}

// 查询积分签到规则详情
export const getSignInConfig = async (id: number) => {
  return await request.get({ url: `/member/sign-in/config/get?id=` + id })
}

// 新增积分签到规则
export const createSignInConfig = async (data: SignInConfigVO) => {
  return await request.post({ url: `/member/sign-in/config/create`, data })
}

// 修改积分签到规则
export const updateSignInConfig = async (data: SignInConfigVO) => {
  return await request.put({ url: `/member/sign-in/config/update`, data })
}

// 删除积分签到规则
export const deleteSignInConfig = async (id: number) => {
  return await request.delete({ url: `/member/sign-in/config/delete?id=` + id })
}
