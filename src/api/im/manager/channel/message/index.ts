import request from '@/config/axios'

export interface ImManagerChannelMessageVO {
  id: number
  channelId: number
  channelName?: string
  materialId: number
  materialTitle?: string
  materialCoverUrl?: string
  type: number
  content?: string
  receiverUserIds?: number[]
  sendTime?: Date
}

export interface ImManagerChannelMessageSendReqVO {
  materialId: number
  receiverUserIds?: number[]
}

// 立即推送频道消息
export const sendManagerChannelMessage = (data: ImManagerChannelMessageSendReqVO) => {
  return request.post({ url: '/im/manager/channel-message/send', data })
}

// 删除频道消息
export const deleteManagerChannelMessage = (id: number) => {
  return request.delete({ url: '/im/manager/channel-message/delete', params: { id } })
}

// 获得频道消息分页
export const getManagerChannelMessagePage = (params: PageParam) => {
  return request.get({ url: '/im/manager/channel-message/page', params })
}
