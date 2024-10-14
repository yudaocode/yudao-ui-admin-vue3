import request from '@/config/axios'

// IoT 设备 VO
export interface DeviceVO {
  id: number // 设备 ID，主键，自增
  deviceKey: string // 设备唯一标识符
  deviceName: string // 设备名称
  productId: number // 产品编号
  productKey: string // 产品标识
  deviceType: number // 设备类型
  nickname: string // 设备备注名称
  gatewayId: number // 网关设备 ID
  status: number // 设备状态
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
  authType: string // 认证类型
  latitude: number // 设备位置的纬度
  longitude: number // 设备位置的经度
  areaId: number // 地区编码
  address: string // 设备详细地址
  serialNumber: string // 设备序列号
}

export interface DeviceUpdateStatusVO {
  id: number // 设备 ID，主键，自增
  status: number // 设备状态
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

  // 获取设备数量
  getDeviceCount: async (productId: number) => {
    return await request.get({ url: `/iot/device/count?productId=` + productId })
  }
}
