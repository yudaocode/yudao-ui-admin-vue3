import request from '@/config/axios'

// TODO @AI：应该是 message/group/xxx，保持和前端一致
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
  sendTime: Date
  createTime: Date
}

// 获得私聊消息分页
export const getManagerPrivateMessagePage = (params: PageParam) => {
  return request.get({ url: '/im/manager/message/private/page', params })
}

// 获得私聊消息详情
export const getManagerPrivateMessage = (id: number) => {
  return request.get({ url: '/im/manager/message/private/get?id=' + id })
}
