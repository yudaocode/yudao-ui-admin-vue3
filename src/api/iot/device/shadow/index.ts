import request from '@/config/axios'

/** 设备影子属性对比 VO */
export interface DeviceShadowPropertyVO {
  identifier: string
  name: string
  dataType: string
  dataSpecs?: any
  dataSpecsList?: any[]
  desiredValue?: any
  reportedValue?: any
  desiredTime?: number
  reportedTime?: number
}

/** 设备影子 VO */
export interface DeviceShadowVO {
  version: number
  shadowTime: number
  status: number
  properties: DeviceShadowPropertyVO[]
  desired: Record<string, any>
  reported: Record<string, any>
  metadata: Record<string, any>
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
