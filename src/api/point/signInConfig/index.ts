import request from '@/config/axios'

export interface SignInConfigVO {
  id: number
  day: number | null
  point: number | null
  isEnable: boolean | null
}

// 查询积分签到规则列表
export const getSignInConfigPage = async () => {
  return await request.get({ url: `/point/sign-in-config/list` })
}

// 查询积分签到规则详情
export const getSignInConfig = async (id: number) => {
  return await request.get({ url: `/point/sign-in-config/get?id=` + id })
}

// 新增积分签到规则
export const createSignInConfig = async (data: SignInConfigVO) => {
  return await request.post({ url: `/point/sign-in-config/create`, data })
}

// 修改积分签到规则
export const updateSignInConfig = async (data: SignInConfigVO) => {
  return await request.put({ url: `/point/sign-in-config/update`, data })
}

// 删除积分签到规则
export const deleteSignInConfig = async (id: number) => {
  return await request.delete({ url: `/point/sign-in-config/delete?id=` + id })
}
