import request from '@/config/axios'

export interface Demo03StudentVO {
  id: number
  name: string
  sex: number
  birthday: Date
  description: string
}

// 查询学生分页
export const getDemo03StudentPage = async (params) => {
  return await request.get({ url: `/infra/demo03-student/page`, params })
}

// 查询学生详情
export const getDemo03Student = async (id: number) => {
  return await request.get({ url: `/infra/demo03-student/get?id=` + id })
}

// 新增学生
export const createDemo03Student = async (data: Demo03StudentVO) => {
  return await request.post({ url: `/infra/demo03-student/create`, data })
}

// 修改学生
export const updateDemo03Student = async (data: Demo03StudentVO) => {
  return await request.put({ url: `/infra/demo03-student/update`, data })
}

// 删除学生
export const deleteDemo03Student = async (id: number) => {
  return await request.delete({ url: `/infra/demo03-student/delete?id=` + id })
}

// 导出学生 Excel
export const exportDemo03Student = async (params) => {
  return await request.download({ url: `/infra/demo03-student/export-excel`, params })
}

// ==================== 子表（学生课程） ====================

// 获得学生课程列表
export const getDemo03CourseListByStudentId = async (studentId) => {
  return await request.get({
    url: `/infra/demo03-student/demo03-course/list-by-student-id?studentId=` + studentId
  })
}

// ==================== 子表（学生班级） ====================

// 获得学生班级
export const getDemo03GradeByStudentId = async (studentId) => {
  return await request.get({
    url: `/infra/demo03-student/demo03-grade/get-by-student-id?studentId=` + studentId
  })
}
