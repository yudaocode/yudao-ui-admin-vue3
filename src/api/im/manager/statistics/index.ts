// IM 数据看板 API
//
// vibe 阶段：所有方法用本地 mock（setTimeout + 随机数据）实现，不发真实请求。
// 后端就绪后把 mockXxx 调用替换为 request.get(...) 一行即可。
//
// import request from '@/config/axios'

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

export interface ImStatisticsDistributionVO {
  messageTypeDistribution: { name: string; value: number }[]
  groupSizeDistribution: { range: string; count: number }[]
  topSenders: { userId: number; nickname: string; messageCount: number }[]
}

// ==================== mock helpers ====================

const fakePromise = <T>(data: T, delay = 300): Promise<T> =>
  new Promise((r) => setTimeout(() => r(data), delay))

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

const buildDates = (days: number): string[] => {
  const dates: string[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

// ==================== exposed APIs ====================

// 获得 KPI 概览
export const getStatisticsOverview = (): Promise<ImStatisticsOverviewVO> => {
  return fakePromise<ImStatisticsOverviewVO>({
    totalUser: 12345,
    newUserToday: 23,
    totalGroup: 678,
    newGroupToday: 4,
    activeUserDaily: 1023,
    activeUserWeekly: 4567,
    activeUserMonthly: 8901,
    privateMessageToday: 8765,
    groupMessageToday: 3210,
    privateMessageYesterday: 7890,
    groupMessageYesterday: 3000
  })
  // 真实请求版本：return request.get({ url: '/im/manager/statistics/overview' })
}

// 获得消息趋势（私聊 + 群聊双线）
export const getMessageTrend = (days: number): Promise<ImStatisticsTrendVO> => {
  const dates = buildDates(days)
  return fakePromise<ImStatisticsTrendVO>({
    dates,
    series: {
      private: dates.map(() => randomInt(500, 2000)),
      group: dates.map(() => randomInt(200, 1200))
    }
  })
  // return request.get({ url: '/im/manager/statistics/message-trend', params: { days } })
}

// 获得用户趋势（新增注册 + 日活双线）
export const getUserTrend = (days: number): Promise<ImStatisticsTrendVO> => {
  const dates = buildDates(days)
  return fakePromise<ImStatisticsTrendVO>({
    dates,
    series: {
      register: dates.map(() => randomInt(5, 80)),
      active: dates.map(() => randomInt(800, 1500))
    }
  })
  // return request.get({ url: '/im/manager/statistics/user-trend', params: { days } })
}

// 获得分布数据（消息类型 / 群规模 / TOP 发送者）
export const getStatisticsDistribution = (): Promise<ImStatisticsDistributionVO> => {
  return fakePromise<ImStatisticsDistributionVO>({
    messageTypeDistribution: [
      { name: '文本', value: 8000 },
      { name: '图片', value: 2400 },
      { name: '视频', value: 320 },
      { name: '语音', value: 980 },
      { name: '文件', value: 540 },
      { name: '位置', value: 65 },
      { name: '名片', value: 32 }
    ],
    groupSizeDistribution: [
      { range: '1-9 人', count: 320 },
      { range: '10-49 人', count: 240 },
      { range: '50-199 人', count: 95 },
      { range: '200+ 人', count: 23 }
    ],
    topSenders: Array.from({ length: 10 }, (_, i) => ({
      userId: 1000 + i,
      nickname: `测试用户${i + 1}`,
      messageCount: 1500 - i * 120
    }))
  })
  // return request.get({ url: '/im/manager/statistics/distribution' })
}
