import request from '@/config/axios'

export interface Demo01StudentVO {
  id: number
  name: string
  description: string
  birthday: Date
  sex: number
  enabled: boolean
  avatar: string
  video: string
  memo: string
}

// 查询学生列表
export const getDemo01StudentPage = async (params) => {
  return await request.get({ url: `/infra/demo01-student/page`, params })
}

// 查询学生详情
export const getDemo01Student = async (id: number) => {
  return await request.get({ url: `/infra/demo01-student/get?id=` + id })
}

// 新增学生
export const createDemo01Student = async (data: Demo01StudentVO) => {
  return await request.post({ url: `/infra/demo01-student/create`, data })
}

// 修改学生
export const updateDemo01Student = async (data: Demo01StudentVO) => {
  return await request.put({ url: `/infra/demo01-student/update`, data })
}

// 删除学生
export const deleteDemo01Student = async (id: number) => {
  return await request.delete({ url: `/infra/demo01-student/delete?id=` + id })
}

// 导出学生 Excel
export const exportDemo01Student = async (params) => {
  return await request.download({ url: `/infra/demo01-student/export-excel`, params })
}