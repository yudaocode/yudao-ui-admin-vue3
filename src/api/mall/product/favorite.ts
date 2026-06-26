import request from '@/config/axios'

export interface Favorite {
  id?: number
  userId?: number // 用户编号
  spuId?: number | null // 商品 SPU 编号
  name?: string
  picUrl?: string
  price?: number
  salesCount?: number
  createTime?: Date
  status?: number
}

// 获得 ProductFavorite 列表
export const getFavoritePage = (params: PageParam) => {
  return request.get<PageResult<Favorite[]>>({ url: '/product/favorite/page', params })
}
