import request from '@/config/axios'

/** IoT OTA 任务信息 */
export interface OtaTask {
  id?: number // 任务编号
  name: string // 任务名称
  description?: string // 任务描述
  firmwareId?: number // 固件编号
  status: number // 任务状态
  deviceScope?: number // 升级范围
  deviceIds?: number[] // 指定设备ID列表（当升级范围为指定设备时使用）
  deviceTotalCount?: number // 设备总共数量
  deviceSuccessCount?: number // 设备成功数量
  createTime?: Date // 创建时间
}

// IoT OTA 任务 API
export const IoTOtaTaskApi = {
  // 查询 OTA 升级任务分页
  getOtaTaskPage: async (params: any) => {
    return await request.get({ url: `/iot/ota/task/page`, params })
  },

  // 查询 OTA 升级任务详情
  getOtaTask: async (id: number) => {
    return await request.get({ url: `/iot/ota/task/get?id=` + id })
  },

  // 创建 OTA 升级任务
  createOtaTask: async (data: OtaTask) => {
    return await request.post({ url: `/iot/ota/task/create`, data })
  },

  // 取消 OTA 升级任务
  cancelOtaTask: async (id: number) => {
    return await request.post({ url: `/iot/ota/task/cancel?id=` + id })
  }
}
