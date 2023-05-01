import request from '@/config/axios'
import type { SpuType } from './type/spuType'

// 获得spu列表
export const getSpuList = (params: any) => {
  return request.get({ url: '/product/spu/page', params })
}
// 创建商品spu
export const createSpu = (data: SpuType) => {
  return request.post({ url: '/product/spu/create', data })
}
// 更新商品spu
export const updateSpu = (data: SpuType) => {
  return request.put({ url: '/product/spu/update', data })
}
