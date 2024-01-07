import request from '@/config/axios'
import { DataComparisonRespVO } from '@/api/mall/statistics/common'

export interface ProductStatisticsVO {
  id: number
  day: string
  spuId: number
  spuName: string
  spuPicUrl: string
  browseCount: number
  browseUserCount: number
  favoriteCount: number
  cartCount: number
  orderCount: number
  orderPayCount: number
  orderPayPrice: number
  afterSaleCount: number
  afterSaleRefundPrice: number
  browseConvertPercent: number
}

// 商品统计 API
export const ProductStatisticsApi = {
  // 获得商品统计分析
  getProductStatisticsAnalyse: (params: any) => {
    return request.get<DataComparisonRespVO<ProductStatisticsVO>>({
      url: '/statistics/product/analyse',
      params
    })
  },
  // 获得商品状况明细
  getProductStatisticsList: (params: any) => {
    return request.get<ProductStatisticsVO[]>({
      url: '/statistics/product/list',
      params
    })
  },
  // 导出获得商品状况明细 Excel
  exportProductStatisticsExcel: (params: any) => {
    return request.download({
      url: '/statistics/product/export-excel',
      params
    })
  },
  // 获得商品排行榜分页
  getProductStatisticsRankPage: async (params: any) => {
    return await request.get({
      url: `/statistics/product/rank-page`,
      params
    })
  }
}
