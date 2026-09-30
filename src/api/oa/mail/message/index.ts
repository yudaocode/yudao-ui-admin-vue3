import request from '@/config/axios'

export interface MailMessageVO {
  id?: number // 邮件索引编号
  accountId: number // 邮箱账号编号
  subject: string // 主题
  sender?: string // 发件人
  recipients: string[] // 收件人
  ccs: string[] // 抄送人
  receiveTime?: string // 接收时间
  readStatus?: boolean // 是否已读
  hasAttach?: boolean // 是否有附件
  content?: string // 安全 HTML 正文
  replyTos?: string[] // 回复地址
  attachments?: { part: string; name: string; size: number }[] // 附件
  attachmentParts?: string[] // 保留的原附件路径
  draftId?: number // 原草稿编号
  sourceId?: number // 原邮件编号
  mode?: string // 写信方式
}

// 全量同步远端邮件索引，不受列表分页条件影响
export const syncMailMessageList = (accountId: number) => {
  return request.post({ url: '/oa/mail-message/sync', params: { accountId }, timeout: 300000 })
}

// 获得邮件分页
export const getMailMessagePage = (params: any) => {
  return request.get({ url: '/oa/mail-message/page', params })
}

// 获得邮件详情
export const getMailMessage = (id: number) => {
  return request.get({ url: '/oa/mail-message/get', params: { id }, timeout: 60000 })
}

// 修改已读状态
export const updateMailMessageRead = (id: number, readStatus: boolean) => {
  return request.put({
    url: '/oa/mail-message/update-read',
    params: { id, readStatus },
    timeout: 60000
  })
}

// 恢复已删除邮件到收件箱
export const restoreMailMessage = (id: number) => {
  return request.put({ url: '/oa/mail-message/restore', params: { id } })
}

// 删除邮件
export const deleteMailMessage = (id: number) => {
  return request.delete({ url: '/oa/mail-message/delete', params: { id }, timeout: 60000 })
}

// 保存草稿
export const saveMailMessageDraft = (data: FormData) => {
  return request.post({
    headersType: 'multipart/form-data',
    url: '/oa/mail-message/save-draft',
    data,
    timeout: 120000
  })
}

// 发送邮件，不自动重试
export const sendMailMessage = (data: FormData) => {
  return request.post({
    headersType: 'multipart/form-data',
    url: '/oa/mail-message/send',
    data,
    timeout: 120000
  })
}

// 获得写信预填数据
export const getMailMessageCompose = (id: number, mode: string) => {
  return request.get({ url: '/oa/mail-message/compose', params: { id, mode }, timeout: 60000 })
}

// 下载本人邮件附件
export const downloadMailMessageAttachment = (id: number, part: string) => {
  return request.download({
    url: '/oa/mail-message/attachment',
    params: { id, part },
    timeout: 60000
  })
}
