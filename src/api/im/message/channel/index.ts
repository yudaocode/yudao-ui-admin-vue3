import request from '@/config/axios'

export interface ImChannelMessageRespVO {
  id: number
  channelId: number
  materialId: number
  type: number
  content: string
  sendTime: string
}

// 用户端能看到的频道素材详情
export interface ImChannelMaterialRespVO {
  id: number
  channelId: number
  type: number
  title: string
  coverUrl?: string
  summary?: string
  content?: string
  url?: string
}

// 拉取当前用户应收的频道消息（离线增量）；按 minId 游标分页
export const pullChannelMessages = (params: { minId: number; size?: number }) => {
  return request.get<ImChannelMessageRespVO[]>({
    url: '/im/channel/message/pull',
    params
  })
}

// 获取频道素材详情；用于客户端点击图文卡片渲染详情页
// TODO @AI：这个地址，也要改把。
export const getChannelMaterial = (id: number) => {
  return request.get<ImChannelMaterialRespVO>({ url: '/im/channel/material/get?id=' + id })
}
