import request from '@/config/axios'

// WMS 商品品牌 VO
export interface ItemBrandVO {
  id?: number
  code?: string
  name?: string
  createTime?: Date
}

// WMS 商品品牌 API
export const ItemBrandApi = {
  // 查询商品品牌分页
  getItemBrandPage: async (params: any) => {
    return await request.get({ url: '/wms/item-brand/page', params })
  },

  // 查询商品品牌精简列表
  getItemBrandSimpleList: async () => {
    return await request.get({ url: '/wms/item-brand/simple-list' })
  },

  // 查询商品品牌详情
  getItemBrand: async (id: number) => {
    return await request.get({ url: '/wms/item-brand/get?id=' + id })
  },

  // 新增商品品牌
  createItemBrand: async (data: ItemBrandVO) => {
    return await request.post({ url: '/wms/item-brand/create', data })
  },

  // 修改商品品牌
  updateItemBrand: async (data: ItemBrandVO) => {
    return await request.put({ url: '/wms/item-brand/update', data })
  },

  // 删除商品品牌
  deleteItemBrand: async (id: number) => {
    return await request.delete({ url: '/wms/item-brand/delete?id=' + id })
  },

  // 导出商品品牌
  exportItemBrand: async (params) => {
    return await request.download({ url: '/wms/item-brand/export-excel', params })
  }
}
