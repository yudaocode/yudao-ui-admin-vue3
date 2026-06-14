import request from '@/config/axios'

export interface ImManagerPrivateMessageVO {
  id: number
  clientMessageId?: string
  senderId: number
  senderNickname?: string
  receiverId: number
  receiverNickname?: string
  type: number
  content: string
  status: number
  receiptStatus: number
  sendTime: Date
  createTime: Date
}

// 获得私聊消息分页
export const getManagerPrivateMessagePage = (params: PageParam) => {
  return request.get({ url: '/im/manager/message/private/page', params })
}

// 获得私聊消息详情
export const getManagerPrivateMessage = (id: number) => {
  return request.get({ url: '/im/manager/message/private/get', params: { id } })
}
