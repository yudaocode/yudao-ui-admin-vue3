import request from '@/config/axios'

/** 设备影子属性对比 VO */
export interface DeviceShadowPropertyVO {
  identifier: string // 属性标识符
  name: string // 属性名称
  dataType: string // 数据类型
  dataSpecs?: any // 数据定义
  dataSpecsList?: any[] // 数据定义列表（枚举、布尔等）
  desiredValue?: any // 期望值
  reportedValue?: any // 上报值
  desiredTime?: number // 期望更新时间（epoch 秒）
  reportedTime?: number // 上报更新时间（epoch 秒）
}

/** 设备影子 VO */
export interface DeviceShadowVO {
  version: number // 版本号
  shadowTime: number // 最后更新时间（epoch 秒）
  status: number // 影子状态
  properties: DeviceShadowPropertyVO[] // 属性对比列表
  desired: Record<string, any> // 期望状态
  reported: Record<string, any> // 上报状态
  metadata: Record<string, any> // 元数据
}

/** 设备影子 API */
export const DeviceShadowApi = {
  /** 获取设备影子 */
  getDeviceShadow: async (deviceId: number) => {
    return await request.get<DeviceShadowVO>({
      url: `/iot/device/shadow/get`,
      params: { deviceId }
    })
  },

  /** 更新期望状态 */
  updateDesiredState: async (data: { deviceId: number; desired: Record<string, any> }) => {
    return await request.put({ url: `/iot/device/shadow/update-desired`, data })
  },

  /** 更新影子开关状态 */
  updateShadowStatus: async (data: { deviceId: number; status: number }) => {
    return await request.put({ url: `/iot/device/shadow/update-status`, data })
  },

  /** 重置影子 */
  resetShadow: async (deviceId: number) => {
    return await request.delete({ url: `/iot/device/shadow/reset`, params: { deviceId } })
  }
}
