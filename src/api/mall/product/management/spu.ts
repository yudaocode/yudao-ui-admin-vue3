import request from '@/config/axios'
import type { SpuType } from './type/spuType'

// 获得spu列表
export const getSpuList = (params: any) => {
  return request.get({ url: '/product/spu/page', params })
}
// 获得spu列表tabsCount
export const getTabsCount = () => {
  return request.get({ url: '/product/spu/tabsCount' })
}
// 创建商品spu
export const createSpu = (data: SpuType) => {
  return request.post({ url: '/product/spu/create', data })
}
// 更新商品spu
export const updateSpu = (data: SpuType) => {
  return request.put({ url: '/product/spu/update', data })
}
// 更新商品spu status
export const updateStatus = (data: { id: number; status: number }) => {
  return request.put({ url: '/product/spu/updateStatus', data })
}
// 获得商品spu
export const getSpu = (id: number) => {
  return request.get({ url: `/product/spu/get-detail?id=${id}` })
}
// 删除商品Spu
export const deleteSpu = (id: number) => {
  return request.delete({ url: `/product/spu/delete?id=${id}` })
}
