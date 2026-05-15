import request from '@/config/axios'

// WMS 商品分类 VO
export interface ItemCategoryVO {
  id?: number
  parentId?: number
  code?: string
  name?: string
  sort?: number
  status?: number
  createTime?: Date
  children?: ItemCategoryVO[]
}

// WMS 商品分类 API
export const ItemCategoryApi = {
  // 查询商品分类列表
  getItemCategoryList: async (params?: any) => {
    return await request.get({ url: '/wms/item-category/list', params })
  },

  // 查询商品分类精简列表
  getItemCategorySimpleList: async () => {
    return await request.get({ url: '/wms/item-category/simple-list' })
  },

  // 查询商品分类详情
  getItemCategory: async (id: number) => {
    return await request.get({ url: '/wms/item-category/get?id=' + id })
  },

  // 新增商品分类
  createItemCategory: async (data: ItemCategoryVO) => {
    return await request.post({ url: '/wms/item-category/create', data })
  },

  // 修改商品分类
  updateItemCategory: async (data: ItemCategoryVO) => {
    return await request.put({ url: '/wms/item-category/update', data })
  },

  // 删除商品分类
  deleteItemCategory: async (id: number) => {
    return await request.delete({ url: '/wms/item-category/delete?id=' + id })
  }
}
