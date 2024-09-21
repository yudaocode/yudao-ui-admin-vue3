import request from '@/config/axios'

// iot 产品 VO
export interface ProductVO {
  name: string // 产品名称
  id: number // 产品ID
  productKey: string // 产品标识
  protocolId: number // 协议编号（脚本解析 id）
  categoryId: number // 产品所属品类标识符
  description: string // 产品描述
  validateType: number // 数据校验级别, 0: 强校验, 1: 弱校验, 2: 免校验
  status: number // 产品状态, 0: DEVELOPMENT_STATUS, 1: RELEASE_STATUS
  deviceType: number // 设备类型, 0: 直连设备, 1: 网关子设备, 2: 网关设备
  netType: number // 联网方式, 0: Wi-Fi, 1: Cellular, 2: Ethernet, 3: 其他
  protocolType: number // 接入网关协议, 0: modbus, 1: opc-ua, 2: customize, 3: ble, 4: zigbee
  dataFormat: number // 数据格式, 0: 透传模式, 1: Alink JSON
}

// iot 产品 API
export const ProductApi = {
  // 查询iot 产品分页
  getProductPage: async (params: any) => {
    return await request.get({ url: `/iot/product/page`, params })
  },

  // 查询iot 产品详情
  getProduct: async (id: number) => {
    return await request.get({ url: `/iot/product/get?id=` + id })
  },

  // 新增iot 产品
  createProduct: async (data: ProductVO) => {
    return await request.post({ url: `/iot/product/create`, data })
  },

  // 修改iot 产品
  updateProduct: async (data: ProductVO) => {
    return await request.put({ url: `/iot/product/update`, data })
  },

  // 删除iot 产品
  deleteProduct: async (id: number) => {
    return await request.delete({ url: `/iot/product/delete?id=` + id })
  },

  // 导出iot 产品 Excel
  exportProduct: async (params) => {
    return await request.download({ url: `/iot/product/export-excel`, params })
  },

  // 更新产品状态
  updateProductStatus: async (id: number, status: number) => {
    return await request.put({ url: `/iot/product/update-status?id=` + id + `&status=` + status })
  },

  // 查询产品（精简)列表
  getSimpleProductList() {
    return request.get({ url: '/iot/product/list-all-simple' })
  }
}
