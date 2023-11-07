import request from '@/config/axios'

export interface ProductVO {
  id: number
  name: string
  no: string
  unit: string
  price: number
  status: number
  categoryId: number
  description: string
  ownerUserId: number
}

// 查询产品列表
export const getProductPage = async (params) => {
  return await request.get({ url: `/crm/product/page`, params })
}

// 查询产品详情
export const getProduct = async (id: number) => {
  return await request.get({ url: `/crm/product/get?id=` + id })
}

// 新增产品
export const createProduct = async (data: ProductVO) => {
  return await request.post({ url: `/crm/product/create`, data })
}

// 修改产品
export const updateProduct = async (data: ProductVO) => {
  return await request.put({ url: `/crm/product/update`, data })
}

// 删除产品
export const deleteProduct = async (id: number) => {
  return await request.delete({ url: `/crm/product/delete?id=` + id })
}

// 导出产品 Excel
export const exportProduct = async (params) => {
  return await request.download({ url: `/crm/product/export-excel`, params })
}
