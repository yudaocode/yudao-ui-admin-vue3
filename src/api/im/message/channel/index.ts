import request from '@/config/axios'

export interface ImChannelMessageRespVO {
  id: number
  channelId: number
  materialId: number
  type: number
  content: string
  sendTime: string
}

// 拉取当前用户应收的频道消息（离线增量）；按 minId 游标分页
export const pullChannelMessages = (params: { minId: number; size?: number }) => {
  return request.get<ImChannelMessageRespVO[]>({
    url: '/im/channel/message/pull',
    params
  })
}
