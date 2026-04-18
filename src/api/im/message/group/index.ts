import request from '@/config/axios'

// 群聊消息发送 Request VO
export interface ImGroupMessageSendReqVO {
  clientMessageId: string // 客户端消息编号
  groupId: number // 群编号
  type: number // 消息类型
  content: string // 消息内容
  atUserIds?: number[] // @ 用户编号列表
  receiverUserIds?: number[] // 定向接收用户编号列表
  needReceipt?: boolean // 是否需要回执
}

// 群聊消息 Response VO
export interface ImGroupMessageRespVO {
  id: string // 消息编号
  clientMessageId: string // 客户端消息编号
  senderId: string // 发送人编号
  groupId: string // 群编号
  type: number // 消息类型
  content: string // 消息内容
  status: number // 消息状态
  sendTime: string // 发送时间
  atUserIds?: number[] // @ 用户编号列表
  receiverUserIds?: number[] // 定向接收用户编号列表
  receiptStatus?: number // 回执状态
  readCount?: number // 已读人数
}

// 发送群聊消息
export const sendGroupMessage = (data: ImGroupMessageSendReqVO) => {
  return request.post<ImGroupMessageRespVO>({ url: '/im/message/group/send', data })
}

// 增量拉取群聊消息
export const pullGroupMessages = (params: { minId: string; size: number }) => {
  return request.get<ImGroupMessageRespVO[]>({ url: '/im/message/group/pull', params })
}

// 标记群聊消息已读
export const readGroupMessages = (groupId: string) => {
  return request.put({ url: '/im/message/group/read', params: { groupId } })
}

// 撤回群聊消息
export const recallGroupMessage = (id: string) => {
  return request.delete({ url: '/im/message/group/recall', params: { id } })
}

// 查询群消息已读用户列表
export const getGroupReadUsers = (params: { groupId: string; messageId: string }) => {
  return request.get<string[]>({ url: '/im/message/group/read-users', params })
}
