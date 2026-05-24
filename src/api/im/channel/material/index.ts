import request from '@/config/axios'

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

// 获取频道素材详情；用于客户端点击图文卡片渲染详情页
export const getChannelMaterial = (id: number) => {
  return request.get<ImChannelMaterialRespVO>({ url: '/im/channel/material/get', params: { id } })
}
