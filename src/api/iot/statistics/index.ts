import request from '@/config/axios'

/** 统计数据类型 */
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

/** 消息统计数据类型 */
export interface IotStatisticsDeviceMessageSummaryRespVO {
  upstreamCounts: Record<number, number>
  downstreamCounts: Record<number, number>
}

// IoT 数据统计 API
export const ProductCategoryApi = {
  // 查询IoT基础数据统计
  getIotStatisticsSummary: async () => {
    return await request.get<IotStatisticsSummaryRespVO>({ 
      url: `/iot/statistics/get-summary`
    })
  },

  // 查询IoT上下行消息数据统计
  getIotStatisticsDeviceMessageSummary: async (params: {
    startTime: number
    endTime: number
  }) => {
    return await request.get<IotStatisticsDeviceMessageSummaryRespVO>({ 
      url: `/iot/statistics/get-log-summary`, 
      params 
    })
  }
}