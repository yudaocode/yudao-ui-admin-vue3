import request from '@/config/axios'

/** OPC UA 点位配置 VO */
export interface DeviceOpcUaPointVO {
  id?: number // 主键
  deviceId: number // 设备编号
  thingModelId?: number // 物模型属性编号
  identifier?: string // 属性标识符（只读，取自物模型）
  name?: string // 属性名称（只读，取自物模型）
  thingModelValid?: boolean // 物模型属性是否仍然有效（只读）
  nodeId: string // NodeId，推荐 nsu= 写法
  collectMode: number // 采集方式
  collectInterval: number // 采集间隔，单位：毫秒
  writable?: boolean // 是否可写（默认 false；物模型属性需要为读写）
  status: number // 状态
}

/** OPC UA 点位配置 API */
export const DeviceOpcUaPointApi = {
  /** 获取设备的 OPC UA 点位分页 */
  getOpcUaPointPage: async (params: any) => {
    return await request.get({ url: `/iot/device-opc-ua-point/page`, params })
  },

  /** 获取 OPC UA 点位详情 */
  getOpcUaPoint: async (id: number) => {
    return await request.get<DeviceOpcUaPointVO>({
      url: `/iot/device-opc-ua-point/get?id=${id}`
    })
  },

  /** 创建 OPC UA 点位配置 */
  createOpcUaPoint: async (data: DeviceOpcUaPointVO) => {
    return await request.post({ url: `/iot/device-opc-ua-point/create`, data })
  },

  /** 更新 OPC UA 点位配置 */
  updateOpcUaPoint: async (data: DeviceOpcUaPointVO) => {
    return await request.put({ url: `/iot/device-opc-ua-point/update`, data })
  },

  /** 删除 OPC UA 点位配置 */
  deleteOpcUaPoint: async (id: number) => {
    return await request.delete({ url: `/iot/device-opc-ua-point/delete?id=${id}` })
  }
}
