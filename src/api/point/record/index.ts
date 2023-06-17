import request from '@/config/axios'

export interface RecordVO {
  id: number
  bizId: string
  bizType: string
  type: string
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

// 查询用户积分记录详情
export const getRecord = async (id: number) => {
  return await request.get({ url: `/point/record/get?id=` + id })
}

// 新增用户积分记录
export const createRecord = async (data: RecordVO) => {
  return await request.post({ url: `/point/record/create`, data })
}

// 修改用户积分记录
export const updateRecord = async (data: RecordVO) => {
  return await request.put({ url: `/point/record/update`, data })
}

// 删除用户积分记录
export const deleteRecord = async (id: number) => {
  return await request.delete({ url: `/point/record/delete?id=` + id })
}

// 导出用户积分记录 Excel
export const exportRecord = async (params) => {
  return await request.download({ url: `/point/record/export-excel`, params })
}
