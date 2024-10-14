import request from '@/config/axios'

/**
 * 获得商品浏览记录分页
 *
 * @param params 请求参数
 */
export const getBrowseHistoryPage = (params: any) => {
  return request.get({ url: '/product/browse-history/page', params })
}
