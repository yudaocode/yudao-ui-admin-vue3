import request from '@/config/axios'

// TODO @AI：参考别的 api 文件，需要有一些注释
export interface ProRouteProductVO {
  id?: number
  routeId: number
  itemId: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitName?: string
  quantity?: number
  productionTime?: number
  timeUnitType?: number
  remark?: string
  createTime?: Date
}

export const ProRouteProductApi = {
  getRouteProductListByRoute: async (routeId: number) => {
    return await request.get({ url: `/mes/pro/route-product/list-by-route?routeId=` + routeId })
  },
  getRouteProduct: async (id: number) => {
    return await request.get({ url: `/mes/pro/route-product/get?id=` + id })
  },
  createRouteProduct: async (data: ProRouteProductVO) => {
    return await request.post({ url: `/mes/pro/route-product/create`, data })
  },
  updateRouteProduct: async (data: ProRouteProductVO) => {
    return await request.put({ url: `/mes/pro/route-product/update`, data })
  },
  deleteRouteProduct: async (id: number) => {
    return await request.delete({ url: `/mes/pro/route-product/delete?id=` + id })
  }
}
