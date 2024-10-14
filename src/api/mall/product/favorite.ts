import request from '@/config/axios'

export interface Favorite {
  id?: number
  userId?: string // 用户编号
  spuId?: number | null // 商品 SPU 编号
}

// 获得 ProductFavorite 列表
export const getFavoritePage = (params: PageParam) => {
  return request.get({ url: '/product/favorite/page', params })
}
