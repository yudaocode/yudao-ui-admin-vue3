import request from '@/config/axios'

// BPM 流程分类 VO
export interface CategoryVO {
  id: number // 分类编号
  name: string // 分类名
  code: string // 分类标志
  status: number // 分类状态
  sort: number // 分类排序
}

// BPM 流程分类 API
export const CategoryApi = {
  // 查询流程分类分页
  getCategoryPage: async (params: any) => {
    return await request.get({ url: `/bpm/category/page`, params })
  },

  // 查询流程分类列表
  getCategorySimpleList: async () => {
    return await request.get({ url: `/bpm/category/simple-list` })
  },

  // 查询流程分类详情
  getCategory: async (id: number) => {
    return await request.get({ url: `/bpm/category/get?id=` + id })
  },

  // 新增流程分类
  createCategory: async (data: CategoryVO) => {
    return await request.post({ url: `/bpm/category/create`, data })
  },

  // 修改流程分类
  updateCategory: async (data: CategoryVO) => {
    return await request.put({ url: `/bpm/category/update`, data })
  },

  // 删除流程分类
  deleteCategory: async (id: number) => {
    return await request.delete({ url: `/bpm/category/delete?id=` + id })
  }
}
