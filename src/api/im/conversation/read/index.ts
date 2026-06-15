import request from '@/config/axios'

// IM 会话读位置 Response VO
export interface ImConversationReadRespVO {
  id: number // 读位置编号（增量拉取游标用）
  conversationType: number // 会话类型，参见 ImConversationType
  targetId: number // 会话目标编号
  messageId: number // 最大已读消息编号
  updateTime?: number // 最近更新时间（毫秒时间戳，增量拉取游标用）
}

// 增量拉取当前用户的会话读位置（重连 / 离线补偿）
export const pullMyConversationReadList = (params: {
  lastUpdateTime?: number
  lastId?: number
  limit: number
}) => {
  return request.get<ImConversationReadRespVO[]>({ url: '/im/conversation-read/pull', params })
}
