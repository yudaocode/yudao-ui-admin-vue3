import request from '@/config/axios'

// IoT 产品 VO
export interface ProductVO {
  id: number // 产品编号
  name: string // 产品名称
  productKey: string // 产品标识
  protocolId: number // 协议编号
  categoryId: number // 产品所属品类标识符
  categoryName?: string // 产品所属品类名称
  icon: string // 产品图标
  picUrl: string // 产品图片
  description: string // 产品描述
  status: number // 产品状态
  deviceType: number // 设备类型
  locationType: number // 设备类型
  netType: number // 联网方式
  codecType: string // 数据格式（编解码器类型）
  deviceCount: number // 设备数量
  createTime: Date // 创建时间
}

// IOT 产品设备类型枚举类 0: 直连设备, 1: 网关子设备, 2: 网关设备
export enum DeviceTypeEnum {
  DEVICE = 0, // 直连设备
  GATEWAY_SUB = 1, // 网关子设备
  GATEWAY = 2 // 网关设备
}
// IOT 产品定位类型枚举类 0: 手动定位, 1: IP 定位, 2: 定位模块定位
export enum LocationTypeEnum {
  IP = 1, // IP 定位
  MODULE = 2, // 设备定位
  MANUAL = 3 // 手动定位
}
// IOT 数据格式（编解码器类型）枚举类
export enum CodecTypeEnum {
  ALINK = 'Alink' // 阿里云 Alink 协议
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
    return request.get({ url: '/iot/product/simple-list' })
  },

  // 根据 ProductKey 获取产品信息
  getProductByKey: async (productKey: string) => {
    return await request.get({ url: `/iot/product/get-by-key`, params: { productKey } })
  }
}
