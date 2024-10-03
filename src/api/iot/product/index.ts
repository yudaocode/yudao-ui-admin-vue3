import request from '@/config/axios'

// IoT 产品 VO
export interface ProductVO {
  id: number // 产品编号
  name: string // 产品名称
  productKey: string // 产品标识
  protocolId: number // 协议编号
  categoryId: number // 产品所属品类标识符
  description: string // 产品描述
  validateType: number // 数据校验级别
  status: number // 产品状态
  deviceType: number // 设备类型
  netType: number // 联网方式
  protocolType: number // 接入网关协议
  dataFormat: number // 数据格式
  deviceCount: number // 设备数量
  createTime: Date // 创建时间
}

// IoT 产品 API
export const ProductApi = {
  // 查询产品分页
  getProductPage: async (params: any) => {
    return await request.get({ url: `/iot/product/page`, params })
  },

  // 查询产品详情
  getProduct: async (id: number) => {
    return await request.get({ url: `/iot/product/get?id=` + id })
  },

  // 新增产品
  createProduct: async (data: ProductVO) => {
    return await request.post({ url: `/iot/product/create`, data })
  },

  // 修改产品
  updateProduct: async (data: ProductVO) => {
    return await request.put({ url: `/iot/product/update`, data })
  },

  // 删除产品
  deleteProduct: async (id: number) => {
    return await request.delete({ url: `/iot/product/delete?id=` + id })
  },

  // 导出产品 Excel
  exportProduct: async (params) => {
    return await request.download({ url: `/iot/product/export-excel`, params })
  },

  // 更新产品状态
  updateProductStatus: async (id: number, status: number) => {
    return await request.put({ url: `/iot/product/update-status?id=` + id + `&status=` + status })
  },

  // 查询产品（精简）列表
  getSimpleProductList() {
    return request.get({ url: '/iot/product/list-all-simple' })
  }
}
