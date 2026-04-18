import request from '@/config/axios'

// 私聊消息发送 Request VO
export interface ImPrivateMessageSendReqVO {
  clientMessageId: string // 客户端消息编号
  receiverId: number // 接收人编号
  type: number // 消息类型
  content: string // 消息内容
}

// 私聊消息 Response VO
export interface ImPrivateMessageRespVO {
  id: number // 消息编号
  clientMessageId: string // 客户端消息编号
  senderId: number // 发送人编号
  receiverId: number // 接收人编号
  type: number // 消息类型
  content: string // 消息内容
  status: number // 消息状态
  sendTime: string // 发送时间
}

// 发送私聊消息
export const sendPrivateMessage = (data: ImPrivateMessageSendReqVO) => {
  return request.post<ImPrivateMessageRespVO>({ url: '/im/message/private/send', data })
}

// 增量拉取私聊消息
export const pullPrivateMessages = (params: { minId: string; size: number }) => {
  return request.get<ImPrivateMessageRespVO[]>({ url: '/im/message/private/pull', params })
}

// 标记私聊消息已读
export const readPrivateMessages = (friendId: string) => {
  return request.put({ url: '/im/message/private/read', params: { friendId } })
}

// 撤回私聊消息
export const recallPrivateMessage = (id: string) => {
  return request.delete({ url: '/im/message/private/recall', params: { id } })
}
