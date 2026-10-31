import request from '@/config/axios'

// IoT 产品 VO
export interface ProductVO {
  id: number // 产品编号
  name: string // 产品名称
  productKey: string // 产品标识
  productSecret?: string // 产品密钥
  registerEnabled?: boolean // 动态注册
  protocolId: number // 协议编号
  categoryId: number // 产品所属品类标识符
  categoryName?: string // 产品所属品类名称
  icon: string // 产品图标
  picUrl: string // 产品图片
  description: string // 产品描述
  status: number // 产品状态
  deviceType: number // 设备类型
  netType: number // 联网方式
  protocolType: string // 协议类型
  serializeType: string // 序列化类型
  deviceCount: number // 设备数量
  scriptContent?: string // 数据解析脚本
  scriptEnabled?: boolean // 数据解析脚本是否启用
  createTime: Date // 创建时间
}

// IoT 产品数据解析脚本更新 Request VO（只提交需要修改的字段）
export interface ProductScriptUpdateReqVO {
  id: number // 产品编号
  scriptContent?: string // 脚本内容
  scriptEnabled?: boolean // 是否启用
}

// IoT 产品数据解析脚本调试 Request VO
export interface ProductScriptDebugReqVO {
  id: number // 产品编号
  scriptContent: string // 脚本内容（当前编辑内容，不保存）
  direction: 'decode' | 'encode' // 调试方向：上行解码、下行编码
  inputHex?: string // 上行解码的输入（HEX，允许空格）
  message?: { method: string; requestId?: string; params?: any } // 下行编码的输入消息
}

// IoT 产品数据解析脚本调试 Response VO
export interface ProductScriptDebugRespVO {
  success: boolean // 是否成功
  durationMs: number // 执行耗时（毫秒）
  message?: any // 上行解码得到的消息；为空表示没有业务消息
  standard?: boolean // 下行编码是否按标准消息下发
  outputHex?: string // 下行编码得到的字节（HEX）
  error?: {
    type: 'ERROR' | 'TIMEOUT' | 'REJECTED' | 'OUTPUT_INVALID' | 'ENCODE_EMPTY' // 错误类型
    message: string // 错误信息
    line?: number // 出错行号
  }
}

// IOT 产品设备类型枚举类 0: 直连设备, 1: 网关子设备, 2: 网关设备
export enum DeviceTypeEnum {
  DEVICE = 0, // 直连设备
  GATEWAY_SUB = 1, // 网关子设备
  GATEWAY = 2 // 网关设备
}
// IoT 协议类型枚举
export enum ProtocolTypeEnum {
  TCP = 'tcp',
  UDP = 'udp',
  WEBSOCKET = 'websocket',
  HTTP = 'http',
  MQTT = 'mqtt',
  EMQX = 'emqx',
  COAP = 'coap',
  MODBUS_TCP_CLIENT = 'modbus_tcp_client',
  MODBUS_TCP_SERVER = 'modbus_tcp_server'
}

// IoT 序列化类型枚举
export enum SerializeTypeEnum {
  JSON = 'json',
  BINARY = 'binary'
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

  // 更新产品数据解析脚本（内容、启用状态）
  updateProductScript: async (data: ProductScriptUpdateReqVO) => {
    return await request.put({ url: `/iot/product/update-script`, data })
  },

  // 调试产品数据解析脚本
  debugProductScript: async (data: ProductScriptDebugReqVO) => {
    return await request.post<ProductScriptDebugRespVO>({ url: `/iot/product/debug-script`, data })
  },

  // 查询产品（精简）列表
  getSimpleProductList(deviceType?: number) {
    return request.get({ url: '/iot/product/simple-list', params: { deviceType } })
  },

  // 根据 ProductKey 获取产品信息
  getProductByKey: async (productKey: string) => {
    return await request.get({ url: `/iot/product/get-by-key`, params: { productKey } })
  }
}
