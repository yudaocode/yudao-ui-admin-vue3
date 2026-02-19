import request from '@/config/axios'

// TODO @AI：参考别的 api 文件，需要有一些注释
export interface ProRouteProductBomVO {
  id?: number
  routeId: number
  processId: number
  productId: number
  itemId: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitName?: string
  quantity?: number
  remark?: string
  createTime?: Date
}

export const ProRouteProductBomApi = {
  getRouteProductBomList: async (params: { routeId: number; processId?: number; productId?: number }) => {
    return await request.get({ url: `/mes/pro/route-product-bom/list`, params })
  },
  getRouteProductBom: async (id: number) => {
    return await request.get({ url: `/mes/pro/route-product-bom/get?id=` + id })
  },
  createRouteProductBom: async (data: ProRouteProductBomVO) => {
    return await request.post({ url: `/mes/pro/route-product-bom/create`, data })
  },
  updateRouteProductBom: async (data: ProRouteProductBomVO) => {
    return await request.put({ url: `/mes/pro/route-product-bom/update`, data })
  },
  deleteRouteProductBom: async (id: number) => {
    return await request.delete({ url: `/mes/pro/route-product-bom/delete?id=` + id })
  }
}
