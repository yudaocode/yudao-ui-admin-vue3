import request from '@/config/axios'

export interface Demo11StudentVO {
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
export const getDemo11StudentPage = async (params) => {
  return await request.get({ url: `/infra/demo11-student/page`, params })
}

// 查询学生详情
export const getDemo11Student = async (id: number) => {
  return await request.get({ url: `/infra/demo11-student/get?id=` + id })
}

// 新增学生
export const createDemo11Student = async (data: Demo11StudentVO) => {
  return await request.post({ url: `/infra/demo11-student/create`, data })
}

// 修改学生
export const updateDemo11Student = async (data: Demo11StudentVO) => {
  return await request.put({ url: `/infra/demo11-student/update`, data })
}

// 删除学生
export const deleteDemo11Student = async (id: number) => {
  return await request.delete({ url: `/infra/demo11-student/delete?id=` + id })
}

// 导出学生 Excel
export const exportDemo11Student = async (params) => {
  return await request.download({ url: `/infra/demo11-student/export-excel`, params })
}

// ==================== 子表（学生联系人） ====================

// 获得学生联系人列表
export const getDemo11StudentContactListByStudentId = async (studentId) => {
  return await request.get({ url: `/infra/demo11-student/demo11-student/list-by-student-id?studentId=` + studentId })
}

// ==================== 子表（学生班主任） ====================

// 获得学生班主任
export const getDemo11StudentTeacherByStudentId = async (studentId) => {
  return await request.get({ url: `/infra/demo11-student/demo11-student/get-by-student-id?studentId=` + studentId })
}