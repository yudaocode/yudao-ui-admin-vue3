import request from '@/config/axios'

export interface SignInRecordVO {
  id: number
  userId: number
  day: number
  point: number
}
export interface SignInRecordQueryVO {
  pageNo: number
  pageSize: number
  userId?: number
  nickname: number | undefined | null
  day?: number | null | undefined
  point?: number | null | undefined
  createTime: string[] | null | undefined
}

// 查询用户签到积分列表
export const getSignInRecordPage = async (params) => {
  return await request.get({ url: `/member/point/sign-in-record/page`, params })
}
