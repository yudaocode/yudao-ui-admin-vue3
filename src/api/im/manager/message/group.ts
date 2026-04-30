import request from '@/config/axios'

// TODO @AI：应该是 message/group/xxx，保持和前端一致
export interface ImManagerGroupMessageVO {
  id: number
  clientMessageId?: string
  groupId: number
  groupName?: string
  senderId: number
  senderNickname?: string
  type: number
  content: string
  status: number
  atUserIds?: number[]
  receiptStatus?: number
  sendTime: Date
  createTime: Date
}

// 获得群聊消息分页
export const getManagerGroupMessagePage = (params: PageParam) => {
  return request.get({ url: '/im/manager/message/group/page', params })
}

// 获得群聊消息详情
export const getManagerGroupMessage = (id: number) => {
  return request.get({ url: '/im/manager/message/group/get?id=' + id })
}
