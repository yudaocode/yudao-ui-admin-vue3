import request from '@/config/axios'

export interface RecordVO {
  id: number
  bizId: string
  bizType: string
  title: string
  description: string
  point: number
  totalPoint: number
  status: number
  userId: number
  freezingTime: Date
  thawingTime: Date
  createDate: Date
}

// 查询用户积分记录列表
export const getRecordPage = async (params) => {
  return await request.get({ url: `/point/record/page`, params })
}
