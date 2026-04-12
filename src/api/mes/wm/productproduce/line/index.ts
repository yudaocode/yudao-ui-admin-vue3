import request from '@/config/axios'

/** 获取产品产出行分页 */
export const getProductProduceLinePage = (params: any) => {
  return request.get({
    url: '/mes/wm/product-produce-line/page',
    params
  })
}
