import request from '@/config/axios'

export interface Demo12StudentVO {
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
export const getDemo12StudentPage = async (params) => {
  return await request.get({ url: `/infra/demo12-student/page`, params })
}

// 查询学生详情
export const getDemo12Student = async (id: number) => {
  return await request.get({ url: `/infra/demo12-student/get?id=` + id })
}

// 新增学生
export const createDemo12Student = async (data: Demo12StudentVO) => {
  return await request.post({ url: `/infra/demo12-student/create`, data })
}

// 修改学生
export const updateDemo12Student = async (data: Demo12StudentVO) => {
  return await request.put({ url: `/infra/demo12-student/update`, data })
}

// 删除学生
export const deleteDemo12Student = async (id: number) => {
  return await request.delete({ url: `/infra/demo12-student/delete?id=` + id })
}

// 导出学生 Excel
export const exportDemo12Student = async (params) => {
  return await request.download({ url: `/infra/demo12-student/export-excel`, params })
}

// ==================== 子表（学生联系人） ====================

// 获得学生联系人分页
export const getDemo12StudentContactPage = async (params) => {
  return await request.get({ url: `/infra/demo12-student/demo12-student-contact/page`, params })
}
// 新增学生联系人
export const createDemo12StudentContact = async (data) => {
  return await request.post({ url: `/infra/demo12-student/demo12-student-contact/create`, data })
}

// 修改学生联系人
export const updateDemo12StudentContact = async (data) => {
  return await request.put({ url: `/infra/demo12-student/demo12-student-contact/update`, data })
}

// 删除学生联系人
export const deleteDemo12StudentContact = async (id: number) => {
  return await request.delete({ url: `/infra/demo12-student/demo12-student-contact/delete?id=` + id })
}

// 获得学生联系人
export const getDemo12StudentContact = async (id: number) => {
  return await request.get({ url: `/infra/demo12-student/demo12-student-contact/get?id=` + id })
}

// ==================== 子表（学生班主任） ====================

// 获得学生班主任分页
export const getDemo12StudentTeacherPage = async (params) => {
  return await request.get({ url: `/infra/demo12-student/demo12-student-teacher/page`, params })
}
// 新增学生班主任
export const createDemo12StudentTeacher = async (data) => {
  return await request.post({ url: `/infra/demo12-student/demo12-student-teacher/create`, data })
}

// 修改学生班主任
export const updateDemo12StudentTeacher = async (data) => {
  return await request.put({ url: `/infra/demo12-student/demo12-student-teacher/update`, data })
}

// 删除学生班主任
export const deleteDemo12StudentTeacher = async (id: number) => {
  return await request.delete({ url: `/infra/demo12-student/demo12-student-teacher/delete?id=` + id })
}

// 获得学生班主任
export const getDemo12StudentTeacher = async (id: number) => {
  return await request.get({ url: `/infra/demo12-student/demo12-student-teacher/get?id=` + id })
}