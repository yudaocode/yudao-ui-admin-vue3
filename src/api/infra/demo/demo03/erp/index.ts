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
}

// 学生 API
export const Demo03StudentApi = {
  // 查询学生分页
  getDemo03StudentPage: async (params: any) => {
    return await request.get({ url: `/infra/demo03-student-erp/page`, params })
  },

  // 查询学生详情
  getDemo03Student: async (id: number) => {
    return await request.get({ url: `/infra/demo03-student-erp/get?id=` + id })
  },

  // 新增学生
  createDemo03Student: async (data: Demo03Student) => {
    return await request.post({ url: `/infra/demo03-student-erp/create`, data })
  },

  // 修改学生
  updateDemo03Student: async (data: Demo03Student) => {
    return await request.put({ url: `/infra/demo03-student-erp/update`, data })
  },

  // 删除学生
  deleteDemo03Student: async (id: number) => {
    return await request.delete({ url: `/infra/demo03-student-erp/delete?id=` + id })
  },

  /** 批量删除学生 */
  deleteDemo03StudentList: async (ids: number[]) => {
    return await request.delete({ url: `/infra/demo03-student-erp/delete-list?ids=${ids.join(',')}` })
  },

  // 导出学生 Excel
  exportDemo03Student: async (params) => {
    return await request.download({ url: `/infra/demo03-student-erp/export-excel`, params })
  },

// ==================== 子表（学生课程） ====================

  // 获得学生课程分页
  getDemo03CoursePage: async (params) => {
    return await request.get({ url: `/infra/demo03-student-erp/demo03-course/page`, params })
  },
  // 新增学生课程
  createDemo03Course: async (data: Demo03Course) => {
    return await request.post({ url: `/infra/demo03-student-erp/demo03-course/create`, data })
  },

  // 修改学生课程
  updateDemo03Course: async (data: Demo03Course) => {
    return await request.put({ url: `/infra/demo03-student-erp/demo03-course/update`, data })
  },

  // 删除学生课程
  deleteDemo03Course: async (id: number) => {
    return await request.delete({ url: `/infra/demo03-student-erp/demo03-course/delete?id=` + id })
  },

  /** 批量删除学生课程 */
  deleteDemo03CourseList: async (ids: number[]) => {
    return await request.delete({ url: `/infra/demo03-student-erp/demo03-course/delete-list?ids=${ids.join(',')}` })
  },

  // 获得学生课程
  getDemo03Course: async (id: number) => {
    return await request.get({ url: `/infra/demo03-student-erp/demo03-course/get?id=` + id })
  },

// ==================== 子表（学生班级） ====================

  // 获得学生班级分页
  getDemo03GradePage: async (params) => {
    return await request.get({ url: `/infra/demo03-student-erp/demo03-grade/page`, params })
  },
  // 新增学生班级
  createDemo03Grade: async (data: Demo03Grade) => {
    return await request.post({ url: `/infra/demo03-student-erp/demo03-grade/create`, data })
  },

  // 修改学生班级
  updateDemo03Grade: async (data: Demo03Grade) => {
    return await request.put({ url: `/infra/demo03-student-erp/demo03-grade/update`, data })
  },

  // 删除学生班级
  deleteDemo03Grade: async (id: number) => {
    return await request.delete({ url: `/infra/demo03-student-erp/demo03-grade/delete?id=` + id })
  },

  /** 批量删除学生班级 */
  deleteDemo03GradeList: async (ids: number[]) => {
    return await request.delete({ url: `/infra/demo03-student-erp/demo03-grade/delete-list?ids=${ids.join(',')}` })
  },

  // 获得学生班级
  getDemo03Grade: async (id: number) => {
    return await request.get({ url: `/infra/demo03-student-erp/demo03-grade/get?id=` + id })
  },
}
