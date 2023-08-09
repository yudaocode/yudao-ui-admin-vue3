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

// 导出用户签到积分 Excel
export const exportSignInRecord = async (params) => {
  return await request.download({ url: `/point/sign-in-record/export-excel`, params })
}
