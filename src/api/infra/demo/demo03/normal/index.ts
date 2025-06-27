import request from '@/config/axios'
import type { Dayjs } from 'dayjs';

/** 学生课程信息 */
export interface Demo03Course {
  id: number; // 编号
  studentId?: number; // 学生编号
  name?: string; // 名字
  score?: number; // 分数
}

/** 学生班级信息 */
export interface Demo03Grade {
  id: number; // 编号
  studentId?: number; // 学生编号
  name?: string; // 名字
  teacher?: string; // 班主任
}

/** 学生信息 */
export interface Demo03Student {
  id: number; // 编号
  name?: string; // 名字
  sex?: number; // 性别
  birthday?: string | Dayjs; // 出生日期
  description?: string; // 简介
  demo03courses?: Demo03Course[]
  demo03grade?: Demo03Grade
}

// 学生 API
export const Demo03StudentApi = {
  // 查询学生分页
  getDemo03StudentPage: async (params: any) => {
    return await request.get({ url: `/infra/demo03-student-normal/page`, params })
  },

  // 查询学生详情
  getDemo03Student: async (id: number) => {
    return await request.get({ url: `/infra/demo03-student-normal/get?id=` + id })
  },

  // 新增学生
  createDemo03Student: async (data: Demo03Student) => {
    return await request.post({ url: `/infra/demo03-student-normal/create`, data })
  },

  // 修改学生
  updateDemo03Student: async (data: Demo03Student) => {
    return await request.put({ url: `/infra/demo03-student-normal/update`, data })
  },

  // 删除学生
  deleteDemo03Student: async (id: number) => {
    return await request.delete({ url: `/infra/demo03-student-normal/delete?id=` + id })
  },

  /** 批量删除学生 */
  deleteDemo03StudentList: async (ids: number[]) => {
    return await request.delete({ url: `/infra/demo03-student-normal/delete-list?ids=${ids.join(',')}` })
  },

  // 导出学生 Excel
  exportDemo03Student: async (params) => {
    return await request.download({ url: `/infra/demo03-student-normal/export-excel`, params })
  },

// ==================== 子表（学生课程） ====================

  // 获得学生课程列表
  getDemo03CourseListByStudentId: async (studentId) => {
    return await request.get({ url: `/infra/demo03-student-normal/demo03-course/list-by-student-id?studentId=` + studentId })
  },

// ==================== 子表（学生班级） ====================

  // 获得学生班级
  getDemo03GradeByStudentId: async (studentId) => {
    return await request.get({ url: `/infra/demo03-student-normal/demo03-grade/get-by-student-id?studentId=` + studentId })
  },
}
