import request from '@/config/axios'

export interface DemoStudentVO {
  id: number
}

// 查询学生列表
export const getDemoStudentPage = async (params) => {
  return await request.get({ url: `/infra/demo-student/page`, params })
}

// 查询学生详情
export const getDemoStudent = async (id: number) => {
  return await request.get({ url: `/infra/demo-student/get?id=` + id })
}

// 新增学生
export const createDemoStudent = async (data: DemoStudentVO) => {
  return await request.post({ url: `/infra/demo-student/create`, data })
}

// 修改学生
export const updateDemoStudent = async (data: DemoStudentVO) => {
  return await request.put({ url: `/infra/demo-student/update`, data })
}

// 删除学生
export const deleteDemoStudent = async (id: number) => {
  return await request.delete({ url: `/infra/demo-student/delete?id=` + id })
}

// 导出学生 Excel
export const exportDemoStudent = async (params) => {
  return await request.download({ url: `/infra/demo-student/export-excel`, params })
}

// 获得学生联系人列表
export const getDemoStudentContactListByStudentId = async (studentId) => {
  return await request.get({
    url: `/infra/demo-student/demo-student/list-by-student-id?studentId=` + studentId
  })
}

// 获得学生地址
export const getDemoStudentAddressByStudentId = async (studentId) => {
  return await request.get({
    url: `/infra/demo-student/demo-student/get-by-student-id?studentId=` + studentId
  })
}
