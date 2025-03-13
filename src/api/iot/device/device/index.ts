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
  state: number // 设备状态
  onlineTime: Date // 最后上线时间
  offlineTime: Date // 最后离线时间
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
  config: string // 设备配置
  groupIds?: number[] // 添加分组 ID
}

// IoT 设备数据 VO
export interface DeviceDataVO {
  deviceId: number // 设备编号
  thinkModelFunctionId: number // 物模型编号
  productKey: string // 产品标识
  deviceName: string // 设备名称
  identifier: string // 属性标识符
  name: string // 属性名称
  dataType: string // 数据类型
  updateTime: Date // 更新时间
  value: string // 最新值
}

// IoT 设备数据 VO
export interface DeviceHistoryDataVO {
  time: number // 时间
  data: string // 数据
}

// IoT 设备状态枚举
export enum DeviceStateEnum {
  INACTIVE = 0, // 未激活
  ONLINE = 1, // 在线
  OFFLINE = 2 // 离线
}

// IoT 设备上行 Request VO
export interface IotDeviceUpstreamReqVO {
  id: number // 设备编号
  type: string // 消息类型
  identifier: string // 标识符
  data: any // 请求参数
}

// IoT 设备下行 Request VO
export interface IotDeviceDownstreamReqVO {
  id: number // 设备编号
  type: string // 消息类型
  identifier: string // 标识符
  data: any // 请求参数
}

// MQTT 连接参数 VO
export interface MqttConnectionParamsVO {
  mqttClientId: string // MQTT 客户端 ID
  mqttUsername: string // MQTT 用户名
  mqttPassword: string // MQTT 密码
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

  // 修改设备分组
  updateDeviceGroup: async (data: { ids: number[]; groupIds: number[] }) => {
    return await request.put({ url: `/iot/device/update-group`, data })
  },

  // 删除单个设备
  deleteDevice: async (id: number) => {
    return await request.delete({ url: `/iot/device/delete?id=` + id })
  },

  // 删除多个设备
  deleteDeviceList: async (ids: number[]) => {
    return await request.delete({ url: `/iot/device/delete-list`, params: { ids: ids.join(',') } })
  },

  // 导出设备
  exportDeviceExcel: async (params: any) => {
    return await request.download({ url: `/iot/device/export-excel`, params })
  },

  // 获取设备数量
  getDeviceCount: async (productId: number) => {
    return await request.get({ url: `/iot/device/count?productId=` + productId })
  },

  // 获取设备的精简信息列表
  getSimpleDeviceList: async (deviceType?: number) => {
    return await request.get({ url: `/iot/device/simple-list?`, params: { deviceType } })
  },

  // 获取导入模板
  importDeviceTemplate: async () => {
    return await request.download({ url: `/iot/device/get-import-template` })
  },

  // 设备上行
  upstreamDevice: async (data: IotDeviceUpstreamReqVO) => {
    return await request.post({ url: `/iot/device/upstream`, data })
  },

  // 设备下行
  downstreamDevice: async (data: IotDeviceDownstreamReqVO) => {
    return await request.post({ url: `/iot/device/downstream`, data })
  },

  // 获取设备属性最新数据
  getLatestDeviceProperties: async (params: any) => {
    return await request.get({ url: `/iot/device/property/latest`, params })
  },

  // 获取设备属性历史数据
  getHistoryDevicePropertyPage: async (params: any) => {
    return await request.get({ url: `/iot/device/property/history-page`, params })
  },

  // 查询设备日志分页
  getDeviceLogPage: async (params: any) => {
    return await request.get({ url: `/iot/device/log/page`, params })
  },

  // 获取设备MQTT连接参数
  getMqttConnectionParams: async (deviceId: number) => {
    return await request.get({ url: `/iot/device/mqtt-connection-params`, params: { deviceId } })
  }
}
