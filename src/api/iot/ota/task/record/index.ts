import request from '@/config/axios'

/** IoT OTA 任务记录信息 */
export interface OtaTaskRecord {
  id?: number // 升级记录编号
  firmwareId?: number // 固件编号
  firmwareVersion?: string // 固件版本
  taskId?: number // 任务编号
  deviceId?: string // 设备编号
  deviceName?: string // 设备名称
  currentVersion?: string // 当前版本
  fromFirmwareId?: number // 来源的固件编号
  fromFirmwareVersion?: string // 来源的固件版本
  status?: number // 升级状态
  progress?: number // 升级进度，百分比
  description?: string // 升级进度描述
  updateTime?: Date // 更新时间
}

// IoT OTA 任务记录 API
export const IoTOtaTaskRecordApi = {
  getOtaTaskRecordStatusStatistics: async (firmwareId?: number, taskId?: number) => {
    const params: any = {}
    if (firmwareId) params.firmwareId = firmwareId
    if (taskId) params.taskId = taskId
    return await request.get({ url: `/iot/ota/task/record/get-status-statistics`, params })
  },

  // 查询 OTA 任务记录分页
  getOtaTaskRecordPage: async (params: any) => {
    return await request.get({ url: `/iot/ota/task/record/page`, params })
  },

  // 取消 OTA 任务记录
  cancelOtaTaskRecord: async (id: number) => {
    return await request.put({ url: `/iot/ota/task/record/cancel?id=` + id })
  }
}
