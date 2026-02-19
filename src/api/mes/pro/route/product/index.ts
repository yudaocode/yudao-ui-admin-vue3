import request from '@/config/axios'

// MES 工艺路线产品 VO
export interface ProRouteProductVO {
  id?: number // 编号
  routeId: number // 工艺路线编号
  itemId: number // 产品物料编号
  itemCode?: string // 产品编码
  itemName?: string // 产品名称
  specification?: string // 规格型号
  unitName?: string // 单位名称
  quantity?: number // 生产数量
  productionTime?: number // 生产用时
  timeUnitType?: number // 时间单位
  remark?: string // 备注
  createTime?: Date // 创建时间
}

// MES 工艺路线产品 API
export const ProRouteProductApi = {
  // 按工艺路线查询产品列表
  getRouteProductListByRoute: async (routeId: number) => {
    return await request.get({ url: `/mes/pro/route-product/list-by-route?routeId=` + routeId })
  },

  // 查询工艺路线产品详情
  getRouteProduct: async (id: number) => {
    return await request.get({ url: `/mes/pro/route-product/get?id=` + id })
  },

  // 新增工艺路线产品
  createRouteProduct: async (data: ProRouteProductVO) => {
    return await request.post({ url: `/mes/pro/route-product/create`, data })
  },

  // 修改工艺路线产品
  updateRouteProduct: async (data: ProRouteProductVO) => {
    return await request.put({ url: `/mes/pro/route-product/update`, data })
  },

  // 删除工艺路线产品
  deleteRouteProduct: async (id: number) => {
    return await request.delete({ url: `/mes/pro/route-product/delete?id=` + id })
  }
}
