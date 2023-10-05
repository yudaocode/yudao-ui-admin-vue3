import request from '@/config/axios'
import dayjs from 'dayjs'
import { formatDate } from '@/utils/formatTime'

// todo @疯狂：挪到 mall 里哈

/** 交易统计对照 Response VO */
export interface TradeStatisticsComparisonRespVO<T> {
  value: T
  reference: T
}

/** 交易统计 Response VO */
export interface TradeSummaryRespVO {
  yesterdayOrderCount: number
  monthOrderCount: number
  yesterdayPayPrice: number
  monthPayPrice: number
}

/** 交易状况 Request VO */
export interface TradeTrendReqVO {
  times: [dayjs.ConfigType, dayjs.ConfigType]
}

/** 交易状况统计 Response VO */
export interface TradeTrendSummaryRespVO {
  time: string
  turnover: number
  orderPayPrice: number
  rechargePrice: number
  expensePrice: number
  balancePrice: number
  brokerageSettlementPrice: number
  orderRefundPrice: number
}

// 查询交易统计
export const getTradeStatisticsSummary = () => {
  return request.get<TradeStatisticsComparisonRespVO<TradeSummaryRespVO>>({
    url: '/statistics/trade/summary'
  })
}

// 获得交易状况统计
export const getTradeTrendSummary = (params: TradeTrendReqVO) => {
  return request.get<TradeStatisticsComparisonRespVO<TradeTrendSummaryRespVO>>({
    url: '/statistics/trade/trend/summary',
    params: formatDateParam(params)
  })
}

// 获得交易状况明细
export const getTradeTrendList = (params: TradeTrendReqVO) => {
  return request.get<TradeTrendSummaryRespVO[]>({
    url: '/statistics/trade/trend/list',
    params: formatDateParam(params)
  })
}

// 导出交易状况明细
export const exportTradeTrend = (params: TradeTrendReqVO) => {
  return request.download({
    url: '/statistics/trade/trend/export-excel',
    params: formatDateParam(params)
  })
}

/** 时间参数需要格式化, 确保接口能识别 */
const formatDateParam = (params: TradeTrendReqVO) => {
  return { times: [formatDate(params.times[0]), formatDate(params.times[1])] } as TradeTrendReqVO
}
