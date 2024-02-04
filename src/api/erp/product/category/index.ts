import request from '@/config/axios'

// ERP 商品分类 VO
export interface ProductCategoryVO {
  id: number // 分类编号
  parentId: number // 父分类编号
  name: string // 分类名称
  code: string // 分类编码
  sort: number // 分类排序
  status: number // 开启状态
}

// ERP 商品分类 API
export const ProductCategoryApi = {
  // 查询商品分类列表
  getProductCategoryList: async (params) => {
    return await request.get({ url: `/erp/product-category/list`, params })
  },

  // 查询商品分类精简列表
  getProductCategorySimpleList: async () => {
    return await request.get({ url: `/erp/product-category/simple-list` })
  },

  // 查询商品分类详情
  getProductCategory: async (id: number) => {
    return await request.get({ url: `/erp/product-category/get?id=` + id })
  },

  // 新增商品分类
  createProductCategory: async (data: ProductCategoryVO) => {
    return await request.post({ url: `/erp/product-category/create`, data })
  },

  // 修改商品分类
  updateProductCategory: async (data: ProductCategoryVO) => {
    return await request.put({ url: `/erp/product-category/update`, data })
  },

  // 删除商品分类
  deleteProductCategory: async (id: number) => {
    return await request.delete({ url: `/erp/product-category/delete?id=` + id })
  },

  // 导出商品分类 Excel
  exportProductCategory: async (params) => {
    return await request.download({ url: `/erp/product-category/export-excel`, params })
  }
}
