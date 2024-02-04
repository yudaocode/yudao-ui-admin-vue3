import request from '@/config/axios'

// ERP 产品 VO
export interface ProductVO {
  // 产品编号
  id: number
  // 产品名称
  name: string
  // 产品条码
  barCode: string
  // 产品类型编号
  categoryId: number
  // 单位编号
  unitId: number
  // 产品状态
  status: number
  // 产品规格
  standard: string
  // 产品备注
  remark: string
  // 保质期天数
  expiryDay: number
  // 基础重量（kg）
  weight: number
  // 采购价格，单位：元
  purchasePrice: number
  // 销售价格，单位：元
  salePrice: number
  // 最低价格，单位：元
  minPrice: number
}

// ERP 产品 API
export const ProductApi = {
  // 查询产品分页
  getProductPage: async (params: any) => {
    return await request.get({ url: `/erp/product/page`, params })
  },

  // 查询产品详情
  getProduct: async (id: number) => {
    return await request.get({ url: `/erp/product/get?id=` + id })
  },

  // 新增产品
  createProduct: async (data: ProductVO) => {
    return await request.post({ url: `/erp/product/create`, data })
  },

  // 修改产品
  updateProduct: async (data: ProductVO) => {
    return await request.put({ url: `/erp/product/update`, data })
  },

  // 删除产品
  deleteProduct: async (id: number) => {
    return await request.delete({ url: `/erp/product/delete?id=` + id })
  },

  // 导出产品 Excel
  exportProduct: async (params) => {
    return await request.download({ url: `/erp/product/export-excel`, params })
  }
}
