import request from '@/config/axios'

export interface Favorite {
  id?: number
  userId?: string // 用户编号
  spuId?: number | null // 商品 SPU 编号
}

// 获得 ProductFavorite 列表
export const getFavoritePage = (params: PageParam) => {
  params.keyword = params.name
  return request.get({ url: '/product/favorite/page', params })
}

// 收藏商品 Favorite
export const createFavorite = (data: Favorite) => {
  return request.post({ url: '/product/favorite/create', data })
}

// 取消商品收藏 Favorite
export const delFavorite = (data: Favorite) => {
  return request.delete({ url: '/product/favorite/delete', data })
}

// 是否收藏过商品 Favorite
export const exitsFavorite = (data: Favorite) => {
  return request.post({ url: '/product/favorite/exits', data })
}
