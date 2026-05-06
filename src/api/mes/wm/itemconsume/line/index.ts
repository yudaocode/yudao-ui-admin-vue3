import request from '@/config/axios'

// DONE @AI：itemconsume/line/index.ts
/** 根据报工编号分页获取消耗行列表 */
export const getItemConsumeLinePage = (params: any) => {
  return request.get({
    url: '/mes/wm/item-consume-line/page',
    params
  })
}
