import request from '@/config/axios'

// ERP 产品单位 VO
export interface ProductUnitVO {
  id: number // 单位编号
  name: string // 单位名字
  status: number // 单位状态
}

// ERP 产品单位 API
export const ProductUnitApi = {
  // 查询产品单位分页
  getProductUnitPage: async (params: any) => {
    return await request.get({ url: `/erp/product-unit/page`, params })
  },

  // 查询产品单位精简列表
  getProductUnitSimpleList: async () => {
    return await request.get({ url: `/erp/product-unit/simple-list` })
  },

  // 查询产品单位详情
  getProductUnit: async (id: number) => {
    return await request.get({ url: `/erp/product-unit/get?id=` + id })
  },

  // 新增产品单位
  createProductUnit: async (data: ProductUnitVO) => {
    return await request.post({ url: `/erp/product-unit/create`, data })
  },

  // 修改产品单位
  updateProductUnit: async (data: ProductUnitVO) => {
    return await request.put({ url: `/erp/product-unit/update`, data })
  },

  // 删除产品单位
  deleteProductUnit: async (id: number) => {
    return await request.delete({ url: `/erp/product-unit/delete?id=` + id })
  },

  // 导出产品单位 Excel
  exportProductUnit: async (params) => {
    return await request.download({ url: `/erp/product-unit/export-excel`, params })
  }
}
