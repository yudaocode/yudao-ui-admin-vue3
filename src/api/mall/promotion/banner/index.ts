import request from '@/config/axios'

export interface BannerVO {
  id: number
  title: string
  picUrl: string
  status: number
  url: string
  position: number
  sort: number
  memo: string
}

// 查询Banner管理列表
export const getBannerPage = async (params) => {
  return await request.get({ url: `/promotion/banner/page`, params })
}

// 查询Banner管理详情
export const getBanner = async (id: number) => {
  return await request.get({ url: `/promotion/banner/get?id=` + id })
}

// 新增Banner管理
export const createBanner = async (data: BannerVO) => {
  return await request.post({ url: `/promotion/banner/create`, data })
}

// 修改Banner管理
export const updateBanner = async (data: BannerVO) => {
  return await request.put({ url: `/promotion/banner/update`, data })
}

// 删除Banner管理
export const deleteBanner = async (id: number) => {
  return await request.delete({ url: `/promotion/banner/delete?id=` + id })
}
