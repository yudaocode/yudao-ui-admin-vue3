import request from '@/config/axios'

// MES 工艺路线产品 BOM VO
export interface ProRouteProductBomVO {
  id?: number // 编号
  routeId: number // 工艺路线编号
  processId: number // 工序编号
  productId: number // 产品物料编号
  itemId: number // BOM 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  specification?: string // 规格型号
  unitName?: string // 单位名称
  quantity?: number // 用料比例
  remark?: string // 备注
  createTime?: Date // 创建时间
}

// MES 工艺路线产品 BOM API
export const ProRouteProductBomApi = {
  // 查询工艺路线产品 BOM 列表
  getRouteProductBomList: async (params: {
    routeId: number
    processId?: number
    productId?: number
  }) => {
    return await request.get({ url: `/mes/pro/route-product-bom/list`, params })
  },

  // 查询工艺路线产品 BOM 详情
  getRouteProductBom: async (id: number) => {
    return await request.get({ url: `/mes/pro/route-product-bom/get?id=` + id })
  },

  // 新增工艺路线产品 BOM
  createRouteProductBom: async (data: ProRouteProductBomVO) => {
    return await request.post({ url: `/mes/pro/route-product-bom/create`, data })
  },

  // 修改工艺路线产品 BOM
  updateRouteProductBom: async (data: ProRouteProductBomVO) => {
    return await request.put({ url: `/mes/pro/route-product-bom/update`, data })
  },

  // 删除工艺路线产品 BOM
  deleteRouteProductBom: async (id: number) => {
    return await request.delete({ url: `/mes/pro/route-product-bom/delete?id=` + id })
  }
}
