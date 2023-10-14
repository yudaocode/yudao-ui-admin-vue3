import request from '@/config/axios'

export interface ArticleCategoryVO {
  id: number
  name: string
  picUrl: string
  status: number
  sort: number
}

// 查询分类列表
export const getArticleCategoryPage = async (params) => {
  return await request.get({ url: `/promotion/article-category/page`, params })
}

// 查询分类详情
export const getArticleCategory = async (id: number) => {
  return await request.get({ url: `/promotion/article-category/get?id=` + id })
}

// 新增分类
export const createArticleCategory = async (data: ArticleCategoryVO) => {
  return await request.post({ url: `/promotion/article-category/create`, data })
}

// 修改分类
export const updateArticleCategory = async (data: ArticleCategoryVO) => {
  return await request.put({ url: `/promotion/article-category/update`, data })
}

// 删除分类
export const deleteArticleCategory = async (id: number) => {
  return await request.delete({ url: `/promotion/article-category/delete?id=` + id })
}

// 导出分类 Excel
export const exportArticleCategory = async (params) => {
  return await request.download({ url: `/promotion/article-category/export-excel`, params })
}
