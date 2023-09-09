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

// 新增会员经验记录
export const createExperienceRecord = async (data: ExperienceRecordVO) => {
  return await request.post({ url: `/member/experience-record/create`, data })
}

// 修改会员经验记录
export const updateExperienceRecord = async (data: ExperienceRecordVO) => {
  return await request.put({ url: `/member/experience-record/update`, data })
}

// 删除会员经验记录
export const deleteExperienceRecord = async (id: number) => {
  return await request.delete({ url: `/member/experience-record/delete?id=` + id })
}

// 导出会员经验记录 Excel
export const exportExperienceRecord = async (params) => {
  return await request.download({ url: `/member/experience-record/export-excel`, params })
}
