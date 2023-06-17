import request from '@/config/axios'

export interface SignInRecordVO {
  id: number
  userId: number
  day: number
  point: number
}

// 查询用户签到积分列表
export const getSignInRecordPage = async (params) => {
  return await request.get({ url: `/point/sign-in-record/page`, params })
}

// 查询用户签到积分详情
export const getSignInRecord = async (id: number) => {
  return await request.get({ url: `/point/sign-in-record/get?id=` + id })
}

// 新增用户签到积分
export const createSignInRecord = async (data: SignInRecordVO) => {
  return await request.post({ url: `/point/sign-in-record/create`, data })
}

// 修改用户签到积分
export const updateSignInRecord = async (data: SignInRecordVO) => {
  return await request.put({ url: `/point/sign-in-record/update`, data })
}

// 删除用户签到积分
export const deleteSignInRecord = async (id: number) => {
  return await request.delete({ url: `/point/sign-in-record/delete?id=` + id })
}

// 导出用户签到积分 Excel
export const exportSignInRecord = async (params) => {
  return await request.download({ url: `/point/sign-in-record/export-excel`, params })
}
