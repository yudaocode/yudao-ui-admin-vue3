import request from '@/config/axios'

// 私聊消息 Response VO
export interface ImPrivateMessageRespVO {
  id: number // 消息编号
  clientMessageId: string // 客户端消息编号
  senderId: number // 发送人编号
  receiverId: number // 接收人编号
  type: number // 内容类型
  content: string // 消息内容（JSON 格式）
  status: number // 消息状态（正常 / 已撤回）
  receiptStatus?: number // 回执状态（不需要 / 待完成 / 已完成），对齐 ImMessageReceiptStatus
  sendTime: string // 发送时间
}

// 私聊消息发送 Request VO
export interface ImPrivateMessageSendReqVO {
  clientMessageId: string // 客户端消息编号
  receiverId: number // 接收人编号
  type: number // 内容类型
  content: string // 消息内容（JSON 格式）
  receipt?: boolean // 是否需要回执；不传后端默认 true（普通私聊用户消息）
}

// 私聊历史消息列表 Request VO
export interface ImPrivateMessageListReqVO {
  receiverId: number | string // 接收人编号（对方）
  maxId?: number | string // 起始消息编号（不含），为空则从最新消息开始
  limit: number // 拉取数量（1 ~ 200）
}

// 发送私聊消息
export const sendPrivateMessage = (data: ImPrivateMessageSendReqVO) => {
  return request.post<ImPrivateMessageRespVO>({ url: '/im/message/private/send', data })
}

// 拉取私聊消息（增量）
export const pullPrivateMessageList = (
  params: { minId: number | string; size: number },
  signal?: AbortSignal
) => {
  return request.get<ImPrivateMessageRespVO[]>({ url: '/im/message/private/pull', params, signal })
}

// 查询私聊历史消息
export const getPrivateMessageList = (params: ImPrivateMessageListReqVO) => {
  return request.get<ImPrivateMessageRespVO[]>({ url: '/im/message/private/list', params })
}

// 标记私聊消息已读
export const readPrivateMessages = (receiverId: number | string, messageId: number | string) => {
  return request.put<boolean>({
    url: '/im/message/private/read',
    params: { receiverId, messageId }
  })
}

// 查询对方已读到我发的最大消息 id（多端 / 离线后用于补齐已读状态）
export const getPrivateMaxReadMessageId = (peerId: number | string, signal?: AbortSignal) => {
  return request.get<number | null>({
    url: '/im/message/private/max-read-message-id',
    params: { peerId },
    signal
  })
}

// 撤回私聊消息
export const recallPrivateMessage = (id: number | string) => {
  return request.delete<ImPrivateMessageRespVO>({
    url: '/im/message/private/recall',
    params: { id }
  })
}
