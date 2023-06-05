import request from '@/config/axios'

/**
 * 商品品牌
 */
export interface BrandVO {
  /**
   * 品牌编号
   */
  id?: number
  /**
   * 品牌名称
   */
  name: string
  /**
   * 品牌图片
   */
  picUrl: string
  /**
   * 品牌排序
   */
  sort?: number
  /**
   * 品牌描述
   */
  description?: string
  /**
   * 开启状态
   */
  status: number
}

// 创建商品品牌
export const createBrand = (data: BrandVO) => {
  return request.post({ url: '/product/brand/create', data })
}

// 更新商品品牌
export const updateBrand = (data: BrandVO) => {
  return request.put({ url: '/product/brand/update', data })
}

// 删除商品品牌
export const deleteBrand = (id: number) => {
  return request.delete({ url: `/product/brand/delete?id=${id}` })
}

// 获得商品品牌
export const getBrand = (id: number) => {
  return request.get({ url: `/product/brand/get?id=${id}` })
}

// 获得商品品牌列表
export const getBrandParam = (params: PageParam) => {
  return request.get({ url: '/product/brand/page', params })
}

// 获得商品品牌精简信息列表
export const getSimpleBrandList = () => {
  return request.get({ url: '/product/brand/list-all-simple' })
}
