import request from '@/config/axios'

// TODO @zange：挪到 product 下，建个 category 包，挪进去哈；
export interface ProductCategoryVO {
  id: number
  name: string
  parentId: number
}

// 查询产品分类详情
export const getProductCategory = async (id: number) => {
  return await request.get({ url: `/crm/product-category/get?id=` + id })
}

// 新增产品分类
export const createProductCategory = async (data: ProductCategoryVO) => {
  return await request.post({ url: `/crm/product-category/create`, data })
}

// 修改产品分类
export const updateProductCategory = async (data: ProductCategoryVO) => {
  return await request.put({ url: `/crm/product-category/update`, data })
}

// 删除产品分类
export const deleteProductCategory = async (id: number) => {
  return await request.delete({ url: `/crm/product-category/delete?id=` + id })
}

// 产品分类列表
export const getProductCategoryList = async (params) => {
  return await request.get({ url: `/crm/product-category/list`, params })
}
