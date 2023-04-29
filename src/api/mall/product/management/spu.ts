import request from '@/config/axios'
import type { SpuType } from './type/spuType'

// 获得sku列表
export const getSkuList = (params: any) => {
  return request.get({ url: '/product/sku/list', params })
}
// 创建商品spu
export const createSpu = (data: SpuType) => {
  return request.post({ url: '/product/spu/create', data })
}
// 更新商品spu
export const updateSpu = (data: SpuType) => {
  return request.put({ url: '/product/spu/update', data })
}
