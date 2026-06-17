import request from '@/config/axios'
import { ItemSkuVO } from './sku'

// WMS 商品 VO
export interface ItemVO {
  id?: number
  code?: string
  name?: string
  categoryId?: number
  categoryName?: string
  unit?: string
  brandId?: number
  brandName?: string
  remark?: string
  skus?: ItemSkuVO[]
  createTime?: Date
}

// WMS 商品 API
export const ItemApi = {
  // 查询商品分页
  getItemPage: async (params: any) => {
    return await request.get({ url: '/wms/item/page', params })
  },

  // 查询商品精简列表
  getItemSimpleList: async (params?: any) => {
    return await request.get({ url: '/wms/item/simple-list', params })
  },

  // 查询商品详情
  getItem: async (id: number) => {
    return await request.get({ url: '/wms/item/get?id=' + id })
  },

  // 新增商品
  createItem: async (data: ItemVO) => {
    return await request.post({ url: '/wms/item/create', data })
  },

  // 修改商品
  updateItem: async (data: ItemVO) => {
    return await request.put({ url: '/wms/item/update', data })
  },

  // 删除商品
  deleteItem: async (id: number) => {
    return await request.delete({ url: '/wms/item/delete?id=' + id })
  },

  // 导出商品
  exportItem: async (params: any) => {
    return await request.download({ url: '/wms/item/export-excel', params })
  }
}
