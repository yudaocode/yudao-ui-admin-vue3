import request from '@/config/axios'

// ERP 商品分类 VO
export interface ProductCategoryVO {
  // 分类编号
  id: number
  // 父分类编号
  parentId: number
  // 分类名称
  name: string
  // 分类编码
  code: string
  // 分类排序
  sort: number
  // 开启状态
  status: number
}

// ERP 商品分类 API
export const ProductCategoryApi = {
  // 查询ERP 商品分类列表
  getProductCategoryList: async (params) => {
    return await request.get({ url: `/erp/product-category/list`, params })
  },

  // 查询ERP 商品分类详情
  getProductCategory: async (id: number) => {
    return await request.get({ url: `/erp/product-category/get?id=` + id })
  },

  // 新增ERP 商品分类
  createProductCategory: async (data: ProductCategoryVO) => {
    return await request.post({ url: `/erp/product-category/create`, data })
  },

  // 修改ERP 商品分类
  updateProductCategory: async (data: ProductCategoryVO) => {
    return await request.put({ url: `/erp/product-category/update`, data })
  },

  // 删除ERP 商品分类
  deleteProductCategory: async (id: number) => {
    return await request.delete({ url: `/erp/product-category/delete?id=` + id })
  },

  // 导出ERP 商品分类 Excel
  exportProductCategory: async (params) => {
    return await request.download({ url: `/erp/product-category/export-excel`, params })
  }
}