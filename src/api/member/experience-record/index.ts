import request from '@/config/axios'

export interface ExperienceRecordVO {
  id: number
  userId: number
  bizId: string
  bizType: number
  title: string
  description: string
  experience: number
  totalExperience: number
}

// 查询会员经验记录列表
export const getExperienceRecordPage = async (params) => {
  return await request.get({ url: `/member/experience-record/page`, params })
}

// 查询会员经验记录详情
export const getExperienceRecord = async (id: number) => {
  return await request.get({ url: `/member/experience-record/get?id=` + id })
}
