import request from '@/config/axios'

export interface SmsLogVO {
  id: number | null
  channelId: number | null
  channelCode: string
  templateId: number | null
  templateCode: string
  templateType: number | null
  templateContent: string
  templateParams: Map<string, object> | null
  apiTemplateId: string
  mobile: string
  userId: number | null
  userType: number | null
  sendStatus: number | null
  sendTime: Date | null
  sendCode: number | null
  sendMsg: string
  apiSendCode: string
  apiSendMsg: string
  apiRequestId: string
  apiSerialNo: string
  receiveStatus: number | null
  receiveTime: Date | null
  apiReceiveCode: string
  apiReceiveMsg: string
  createTime: Date | null
}

export interface SmsLogPageReqVO extends PageParam {
  channelId?: number | null
  templateId?: number | null
  mobile?: string
  sendStatus?: number | null
  sendTime?: Date[]
  receiveStatus?: number | null
  receiveTime?: Date[]
}
export interface SmsLogExportReqVO {
  channelId?: number
  templateId?: number
  mobile?: string
  sendStatus?: number
  sendTime?: Date[]
  receiveStatus?: number
  receiveTime?: Date[]
}

// 查询短信日志列表
export const getSmsLogPageApi = (params: SmsLogPageReqVO) => {
  return request.get({ url: '/system/sms-log/page', params })
}

// 导出短信日志
export const exportSmsLogApi = (params: SmsLogExportReqVO) => {
  return request.download({ url: '/system/sms-log/export-excel', params })
}
