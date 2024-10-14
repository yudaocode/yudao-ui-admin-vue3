import request from '@/config/axios'

/**
 * 产品分类
 */
export interface CategoryVO {
  /**
   * 分类编号
   */
  id?: number
  /**
   * 父分类编号
   */
  parentId?: number
  /**
   * 分类名称
   */
  name: string
  /**
   * 移动端分类图
   */
  picUrl: string
  /**
   * 分类排序
   */
  sort: number
  /**
   * 开启状态
   */
  status: number
}

// 创建商品分类
export const createCategory = (data: CategoryVO) => {
  return request.post({ url: '/product/category/create', data })
}

// 更新商品分类
export const updateCategory = (data: CategoryVO) => {
  return request.put({ url: '/product/category/update', data })
}

// 删除商品分类
export const deleteCategory = (id: number) => {
  return request.delete({ url: `/product/category/delete?id=${id}` })
}

// 获得商品分类
export const getCategory = (id: number) => {
  return request.get({ url: `/product/category/get?id=${id}` })
}

// 获得商品分类列表
export const getCategoryList = (params: any) => {
  return request.get({ url: '/product/category/list', params })
}
