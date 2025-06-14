import request from '@/config/axios'

/** IoT 统计数据类型 */
export interface IotStatisticsSummaryRespVO {
  productCategoryCount: number
  productCount: number
  deviceCount: number
  deviceMessageCount: number
  productCategoryTodayCount: number
  productTodayCount: number
  deviceTodayCount: number
  deviceMessageTodayCount: number
  deviceOnlineCount: number
  deviceOfflineCount: number
  deviceInactiveCount: number
  productCategoryDeviceCounts: Record<string, number>
}

/** 时间戳-数值的键值对类型 */
interface TimeValueItem {
  [key: string]: number
}

/** IoT 消息统计数据类型 */
export interface IotStatisticsDeviceMessageSummaryRespVO {
  statType: number
  upstreamCounts: TimeValueItem[]
  downstreamCounts: TimeValueItem[]
}

/** 新的消息统计数据项 */
export interface IotStatisticsDeviceMessageSummaryByDateRespVO {
  time: string
  upstreamCount: number
  downstreamCount: number
}

/** 新的消息统计接口参数 */
export interface IotStatisticsDeviceMessageReqVO {
  interval: number
  times?: string[]
}

// IoT 数据统计 API
export const StatisticsApi = {
  // 查询全局的数据统计
  getStatisticsSummary: async () => {
    return await request.get<IotStatisticsSummaryRespVO>({
      url: `/iot/statistics/get-summary`
    })
  },

  // 获取设备消息的数据统计
  getDeviceMessageSummaryByDate: async (params: IotStatisticsDeviceMessageReqVO) => {
    return await request.get<IotStatisticsDeviceMessageSummaryByDateRespVO[]>({
      url: `/iot/statistics/get-device-message-summary-by-date`,
      params
    })
  }
}
