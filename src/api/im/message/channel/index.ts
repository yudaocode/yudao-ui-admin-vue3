import request from '@/config/axios'

export interface ImChannelMessageRespVO {
  id: number
  clientMessageId?: string
  channelId: number
  materialId: number
  type: number
  content: string
  receiptStatus?: number
  sendTime: string
}

// 拉取当前用户应收的频道消息（离线增量）；按 minId 游标分页
export const pullChannelMessageList = (
  params: { minId: number; size?: number },
  signal?: AbortSignal
) => {
  return request.get<ImChannelMessageRespVO[]>({
    url: '/im/channel/message/pull',
    params,
    signal
  })
}

// 上报频道消息已读位置；切到频道会话或拉到新消息后调
export const readChannelMessages = (channelId: number, messageId: number) => {
  return request.put({
    url: '/im/channel/message/read',
    params: { channelId, messageId }
  })
}
