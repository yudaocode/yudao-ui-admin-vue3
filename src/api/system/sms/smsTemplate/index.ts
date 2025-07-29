import request from '@/config/axios'

export interface SmsTemplateVO {
  id?: number
  type?: number
  status: number
  code: string
  name: string
  content: string
  remark: string
  apiTemplateId: string
  channelId?: number
  channelCode?: string
  params?: string[]
  createTime?: Date
}

export interface SendSmsReqVO {
  mobile: string
  templateCode: string
  templateParams: Map<String, Object>
}

// 查询短信模板列表
export const getSmsTemplatePage = (params: PageParam) => {
  return request.get({ url: '/system/sms-template/page', params })
}

// 查询短信模板详情
export const getSmsTemplate = (id: number) => {
  return request.get({ url: '/system/sms-template/get?id=' + id })
}

// 新增短信模板
export const createSmsTemplate = (data: SmsTemplateVO) => {
  return request.post({ url: '/system/sms-template/create', data })
}

// 修改短信模板
export const updateSmsTemplate = (data: SmsTemplateVO) => {
  return request.put({ url: '/system/sms-template/update', data })
}

// 删除短信模板
export const deleteSmsTemplate = (id: number) => {
  return request.delete({ url: '/system/sms-template/delete?id=' + id })
}

// 批量删除短信模板
export const deleteSmsTemplateList = (ids: number[]) => {
  return request.delete({ url: '/system/sms-template/delete-list', params: { ids: ids.join(',') } })
}

// 导出短信模板
export const exportSmsTemplate = (params) => {
  return request.download({
    url: '/system/sms-template/export-excel',
    params
  })
}

// 发送短信
export const sendSms = (data: SendSmsReqVO) => {
  return request.post({ url: '/system/sms-template/send-sms', data })
}
