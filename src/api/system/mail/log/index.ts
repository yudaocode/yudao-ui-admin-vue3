import request from '@/config/axios'

export interface MailLogVO {
  id: number
  userId: number
  userType: number
  toMails: string[]
  ccMails?: string[]
  bccMails?: string[]
  accountId: number
  fromMail: string
  templateId: number
  templateCode: string
  templateNickname: string
  templateTitle: string
  templateContent: string
  templateParams: string
  sendStatus: number
  sendTime: Date
  sendMessageId: string
  sendException: string
}

// 查询邮件日志列表
export const getMailLogPage = async (params: PageParam) => {
  return await request.get({ url: '/system/mail-log/page', params })
}

// 查询邮件日志详情
export const getMailLog = async (id: number) => {
  return await request.get({ url: '/system/mail-log/get?id=' + id })
}

// 导出邮件日志
export const exportMailLog = (params) => {
  return request.download({ url: '/system/mail-log/export-excel', params })
}
