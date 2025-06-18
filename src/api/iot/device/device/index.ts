import request from '@/config/axios'

// IoT 设备 VO
export interface DeviceVO {
  id: number // 设备 ID，主键，自增
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

// TODO @芋艿：调整到 constants
// IoT 设备状态枚举
export enum DeviceStateEnum {
  INACTIVE = 0, // 未激活
  ONLINE = 1, // 在线
  OFFLINE = 2 // 离线
}

// 设备认证参数 VO
export interface IotDeviceAuthInfoVO {
  clientId: string // 客户端 ID
  username: string // 用户名
  password: string // 密码
}

// IoT 设备发送消息 Request VO
export interface IotDeviceMessageSendReqVO {
  deviceId: number // 设备编号
  method: string // 请求方法
  params?: any // 请求参数
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

  // 获取设备属性最新数据
  getLatestDeviceProperties: async (params: any) => {
    return await request.get({ url: `/iot/device/property/get-latest`, params })
  },

  // 获取设备属性历史数据
  getHistoryDevicePropertyList: async (params: any) => {
    return await request.get({ url: `/iot/device/property/history-list`, params })
  },

  // 获取设备认证信息
  getDeviceAuthInfo: async (id: number) => {
    return await request.get({ url: `/iot/device/get-auth-info`, params: { id } })
  },

  // 根据 ProductKey 和 DeviceNames 获取设备列表
  // TODO @puhui999：有没可能搞成基于 id 的查询哈？
  getDevicesByProductKeyAndNames: async (productKey: string, deviceNames: string[]) => {
    return await request.get({
      url: `/iot/device/list-by-product-key-and-names`,
      params: {
        productKey,
        deviceNames: deviceNames.join(',')
      }
    })
  },

  // 查询设备消息分页
  getDeviceMessagePage: async (params: any) => {
    return await request.get({ url: `/iot/device/message/page`, params })
  },

  // 发送设备消息
  sendDeviceMessage: async (params: IotDeviceMessageSendReqVO) => {
    return await request.post({ url: `/iot/device/message/send`, data: params })
  }
}
