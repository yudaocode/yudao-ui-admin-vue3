import request from '@/config/axios'

// 设备 VO
export interface DeviceVO {
  id: number // 设备 ID，主键，自增
  deviceKey: string // 设备唯一标识符，全局唯一，用于识别设备
  deviceName: string // 设备名称，在产品内唯一，用于标识设备
  productId: number // 产品 ID，关联 iot_product 表的 id
  productKey: string // 产品 Key，关联 iot_product 表的 product_key
  deviceType: number // 设备类型：0 - 直连设备，1 - 网关子设备，2 - 网关设备
  nickname: string // 设备备注名称，供用户自定义备注
  gatewayId: number // 网关设备 ID，子设备需要关联的网关设备 ID
  status: number // 设备状态：0 - 未激活，1 - 在线，2 - 离线，3 - 已禁用
  statusLastUpdateTime: Date // 设备状态最后更新时间
  lastOnlineTime: Date // 最后上线时间
  lastOfflineTime: Date // 最后离线时间
  activeTime: Date // 设备激活时间
  createTime: Date // 创建时间
  ip: string // 设备的 IP 地址
  firmwareVersion: string // 设备的固件版本
  deviceSecret: string // 设备密钥，用于设备认证，需安全存储
  mqttClientId: string // MQTT 客户端 ID
  mqttUsername: string // MQTT 用户名
  mqttPassword: string // MQTT 密码
  authType: string // 认证类型（如一机一密、动态注册）
  latitude: number // 设备位置的纬度，范围 -90.000000 ~ 90.000000
  longitude: number // 设备位置的经度，范围 -180.000000 ~ 180.000000
  areaId: number // 地区编码，符合国家地区编码标准，关联地区表
  address: string // 设备详细地址
  serialNumber: string // 设备序列号
}

export interface DeviceUpdateStatusVO {
  id: number // 设备 ID，主键，自增
  status: number // 设备状态：0 - 未激活，1 - 在线，2 - 离线，3 - 已禁用
}

// 设备 API
export const DeviceApi = {
  // 查询设备分页
  getDevicePage: async (params: any) => {
    return await request.get({ url: `/iot/device/page`, params })
  },

  // 查询设备详情
  getDevice: async (id: number) => {
    return await request.get({ url: `/iot/device/get?id=` + id })
  },

  // 新增设备
  createDevice: async (data: DeviceVO) => {
    return await request.post({ url: `/iot/device/create`, data })
  },

  // 修改设备
  updateDevice: async (data: DeviceVO) => {
    return await request.put({ url: `/iot/device/update`, data })
  },

  // 修改设备状态
  updateDeviceStatus: async (data: DeviceUpdateStatusVO) => {
    return await request.put({ url: `/iot/device/update-status`, data })
  },

  // 删除设备
  deleteDevice: async (id: number) => {
    return await request.delete({ url: `/iot/device/delete?id=` + id })
  },

  // 导出设备 Excel
  exportDevice: async (params) => {
    return await request.download({ url: `/iot/device/export-excel`, params })
  }
}
