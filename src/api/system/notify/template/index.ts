import request from '@/config/axios'

export interface NotifyTemplateVO {
  id?: number
  name: string
  nickname: string
  code: string
  content: string
  type?: number
  params: string
  status: number
  remark: string
}

export interface NotifySendReqVO {
  userId: number | null
  templateCode: string
  templateParams: Map<String, Object>
}

// 查询站内信模板列表
export const getNotifyTemplatePage = async (params: PageParam) => {
  return await request.get({ url: '/system/notify-template/page', params })
}

// 查询站内信模板详情
export const getNotifyTemplate = async (id: number) => {
  return await request.get({ url: '/system/notify-template/get?id=' + id })
}

// 新增站内信模板
export const createNotifyTemplate = async (data: NotifyTemplateVO) => {
  return await request.post({ url: '/system/notify-template/create', data })
}

// 修改站内信模板
export const updateNotifyTemplate = async (data: NotifyTemplateVO) => {
  return await request.put({ url: '/system/notify-template/update', data })
}

// 删除站内信模板
export const deleteNotifyTemplate = async (id: number) => {
  return await request.delete({ url: '/system/notify-template/delete?id=' + id })
}

// 发送站内信
export const sendNotify = (data: NotifySendReqVO) => {
  return request.post({ url: '/system/notify-template/send-notify', data })
}
