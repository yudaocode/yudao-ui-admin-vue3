import request from '@/config/axios'

/** IoT 告警记录信息 */
export interface AlertRecord {
  id: number // 记录编号
  configId: number // 告警配置编号
  configName: string // 告警名称
  configLevel: number // 告警级别
  productId: number // 产品编号
  deviceId: number // 设备编号
  deviceMessage: any // 触发的设备消息
  processStatus?: boolean // 是否处理
  processRemark: string // 处理结果（备注）
}

// IoT 告警记录 API
export const AlertRecordApi = {
  // 查询告警记录分页
  getAlertRecordPage: async (params: any) => {
    return await request.get({ url: `/iot/alert-record/page`, params })
  },

  // 查询告警记录详情
  getAlertRecord: async (id: number) => {
    return await request.get({ url: `/iot/alert-record/get?id=` + id })
  },

  // 处理告警记录
  processAlertRecord: async (id: number, processRemark: string) => {
    return await request.put({
      url: `/iot/alert-record/process`,
      data: { id, processRemark }
    })
  }
}
