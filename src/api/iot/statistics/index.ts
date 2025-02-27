import request from '@/config/axios'

// IoT 数据统计 API
export const ProductCategoryApi = {
  // 查询首页所需数据统计信息
  getIotMainStats: async (params: any) => {
    return await request.get({ url: `/iot/statistics/main`, params })
  }

}