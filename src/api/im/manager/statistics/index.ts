import request from '@/config/axios'

export interface ImStatisticsOverviewVO {
  totalUser: number
  newUserToday: number
  totalGroup: number
  newGroupToday: number
  activeUserDaily: number
  activeUserWeekly: number
  activeUserMonthly: number
  privateMessageToday: number
  groupMessageToday: number
  privateMessageYesterday: number
  groupMessageYesterday: number
}

export interface ImStatisticsTrendVO {
  dates: string[]
  series: Record<string, number[]>
}

export interface ImStatisticsMessageTypeVO {
  type: number // 参见 ImContentTypeEnum 枚举类，由前端按 DICT_TYPE.IM_CONTENT_TYPE 翻译
  value: number
}

export interface ImStatisticsGroupSizeVO {
  range: string
  count: number
}

export interface ImStatisticsTopSenderVO {
  userId: number
  nickname: string
  messageCount: number
}

// 获得 KPI 概览
export const getStatisticsOverview = (): Promise<ImStatisticsOverviewVO> => {
  return request.get<ImStatisticsOverviewVO>({ url: '/im/manager/statistics/overview' })
}

// 获得消息趋势（私聊 + 群聊双线）
export const getMessageTrend = (days: number): Promise<ImStatisticsTrendVO> => {
  return request.get<ImStatisticsTrendVO>({
    url: '/im/manager/statistics/message-trend',
    params: { days }
  })
}

// 获得用户趋势（新增注册 + 日活双线）
export const getUserTrend = (days: number): Promise<ImStatisticsTrendVO> => {
  return request.get<ImStatisticsTrendVO>({
    url: '/im/manager/statistics/user-trend',
    params: { days }
  })
}

// 获得内容类型分布（最近 30 天）
export const getMessageTypeDistribution = (): Promise<ImStatisticsMessageTypeVO[]> => {
  return request.get<ImStatisticsMessageTypeVO[]>({
    url: '/im/manager/statistics/message-type-distribution'
  })
}

// 获得群规模分布
export const getGroupSizeDistribution = (): Promise<ImStatisticsGroupSizeVO[]> => {
  return request.get<ImStatisticsGroupSizeVO[]>({
    url: '/im/manager/statistics/group-size-distribution'
  })
}

// 获得消息 TOP 发送者（最近 30 天）
export const getTopSenders = (): Promise<ImStatisticsTopSenderVO[]> => {
  return request.get<ImStatisticsTopSenderVO[]>({ url: '/im/manager/statistics/top-senders' })
}
