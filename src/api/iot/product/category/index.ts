import request from '@/config/axios'

// IoT 产品分类 VO
export interface ProductCategoryVO {
  id: number // 分类 ID
  name: string // 分类名字
  sort: number // 分类排序
  status: number // 分类状态
  description: string // 分类描述
}

// IoT 产品分类 API
export const ProductCategoryApi = {
  // 查询产品分类分页
  getProductCategoryPage: async (params: any) => {
    return await request.get({ url: `/iot/product-category/page`, params })
  },

  // 查询产品分类详情
  getProductCategory: async (id: number) => {
    return await request.get({ url: `/iot/product-category/get?id=` + id })
  },

  // 新增产品分类
  createProductCategory: async (data: ProductCategoryVO) => {
    return await request.post({ url: `/iot/product-category/create`, data })
  },

  // 修改产品分类
  updateProductCategory: async (data: ProductCategoryVO) => {
    return await request.put({ url: `/iot/product-category/update`, data })
  },

  // 删除产品分类
  deleteProductCategory: async (id: number) => {
    return await request.delete({ url: `/iot/product-category/delete?id=` + id })
  },

  /** 获取产品分类精简列表 */
  getSimpleProductCategoryList: () => {
    return request.get({ url: '/iot/product-category/simple-list' })
  }
}
