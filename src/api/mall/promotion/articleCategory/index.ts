import request from '@/config/axios'

export interface ArticleCategoryVO {
  id: number
  name: string
  picUrl: string
  status: number
  sort: number
}

// 查询文章分类列表
export const getArticleCategoryPage = async (params) => {
  return await request.get({ url: `/promotion/article-category/page`, params })
}

// 查询文章分类精简信息列表
export const getSimpleArticleCategoryList = async () => {
  return await request.get({ url: `/promotion/article-category/list-all-simple` })
}

// 查询文章分类详情
export const getArticleCategory = async (id: number) => {
  return await request.get({ url: `/promotion/article-category/get?id=` + id })
}

// 新增文章分类
export const createArticleCategory = async (data: ArticleCategoryVO) => {
  return await request.post({ url: `/promotion/article-category/create`, data })
}

// 修改文章分类
export const updateArticleCategory = async (data: ArticleCategoryVO) => {
  return await request.put({ url: `/promotion/article-category/update`, data })
}

// 删除文章分类
export const deleteArticleCategory = async (id: number) => {
  return await request.delete({ url: `/promotion/article-category/delete?id=` + id })
}
