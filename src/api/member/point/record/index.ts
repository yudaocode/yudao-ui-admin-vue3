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
export interface RecordQueryVO {
  bizType: string | null | undefined
  title: string | null | undefined
  pageNo: number
  pageSize: number
  userId: number | null | undefined
  createDate: string[]
}

// 查询用户积分记录列表
export const getRecordPage = async (params) => {
  return await request.get({ url: `/member/point/record/page`, params })
}
