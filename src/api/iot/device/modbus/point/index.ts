import request from '@/config/axios'

/** Modbus 点位配置 VO */
export interface DeviceModbusPointVO {
  id?: number // 主键
  deviceId: number // 设备编号
  thingModelId?: number // 物模型属性编号
  identifier: string // 属性标识符
  name: string // 属性名称
  functionCode?: number // Modbus 功能码
  registerAddress?: number // 寄存器起始地址
  registerCount?: number // 寄存器数量
  byteOrder?: string // 字节序
  rawDataType?: string // 原始数据类型
  scale: number // 缩放因子
  pollInterval: number // 轮询间隔，单位：毫秒
  status: number // 状态
}

/** Modbus 点位配置 API */
export const DeviceModbusPointApi = {
  /** 获取设备的 Modbus 点位分页 */
  getModbusPointPage: async (params: any) => {
    return await request.get({ url: `/iot/device-modbus-point/page`, params })
  },

  /** 获取 Modbus 点位详情 */
  getModbusPoint: async (id: number) => {
    return await request.get<DeviceModbusPointVO>({
      url: `/iot/device-modbus-point/get?id=${id}`
    })
  },

  /** 创建 Modbus 点位配置 */
  createModbusPoint: async (data: DeviceModbusPointVO) => {
    return await request.post({ url: `/iot/device-modbus-point/create`, data })
  },

  /** 更新 Modbus 点位配置 */
  updateModbusPoint: async (data: DeviceModbusPointVO) => {
    return await request.put({ url: `/iot/device-modbus-point/update`, data })
  },

  /** 删除 Modbus 点位配置 */
  deleteModbusPoint: async (id: number) => {
    return await request.delete({ url: `/iot/device-modbus-point/delete?id=${id}` })
  }
}
