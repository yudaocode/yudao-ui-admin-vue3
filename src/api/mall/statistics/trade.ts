import request from '@/config/axios'
import dayjs from 'dayjs'
import { formatDate } from '@/utils/formatTime'
import { DataComparisonRespVO } from '@/api/mall/statistics/common'

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
  turnoverPrice: number
  orderPayPrice: number
  rechargePrice: number
  expensePrice: number
  walletPayPrice: number
  brokerageSettlementPrice: number
  afterSaleRefundPrice: number
}

/** 交易订单数量 Response VO */
export interface TradeOrderCountRespVO {
  /** 待发货 */
  undelivered?: number
  /** 待核销 */
  pickUp?: number
  /** 退款中 */
  afterSaleApply?: number
  /** 提现待审核 */
  auditingWithdraw?: number
}

/** 交易订单统计 Response VO */
export interface TradeOrderSummaryRespVO {
  /** 支付订单商品数 */
  orderPayCount?: number
  /** 总支付金额，单位：分 */
  orderPayPrice?: number
}

/** 订单量趋势统计 Response VO */
export interface TradeOrderTrendRespVO {
  /** 日期 */
  date: string
  /** 订单数量 */
  orderPayCount: number
  /** 订单支付金额 */
  orderPayPrice: number
}

// 查询交易统计
export const getTradeStatisticsSummary = () => {
  return request.get<DataComparisonRespVO<TradeSummaryRespVO>>({
    url: '/statistics/trade/summary'
  })
}

// 获得交易状况统计
export const getTradeTrendSummary = (params: TradeTrendReqVO) => {
  return request.get<DataComparisonRespVO<TradeTrendSummaryRespVO>>({
    url: '/statistics/trade/trend/summary',
    params: formatDateParam(params)
  })
}

// 获得交易状况明细
export const getTradeStatisticsList = (params: TradeTrendReqVO) => {
  return request.get<TradeTrendSummaryRespVO[]>({
    url: '/statistics/trade/list',
    params: formatDateParam(params)
  })
}

// 导出交易状况明细
export const exportTradeStatisticsExcel = (params: TradeTrendReqVO) => {
  return request.download({
    url: '/statistics/trade/export-excel',
    params: formatDateParam(params)
  })
}

// 获得交易订单数量
export const getOrderCount = async () => {
  return await request.get<TradeOrderCountRespVO>({ url: `/statistics/trade/order-count` })
}

// 获得交易订单数量对照
export const getOrderComparison = async () => {
  return await request.get<DataComparisonRespVO<TradeOrderSummaryRespVO>>({
    url: `/statistics/trade/order-comparison`
  })
}

// 获得订单量趋势统计
export const getOrderCountTrendComparison = (
  type: number,
  beginTime: dayjs.ConfigType,
  endTime: dayjs.ConfigType
) => {
  return request.get<DataComparisonRespVO<TradeOrderTrendRespVO>[]>({
    url: '/statistics/trade/order-count-trend',
    params: { type, beginTime: formatDate(beginTime), endTime: formatDate(endTime) }
  })
}

/** 时间参数需要格式化, 确保接口能识别 */
const formatDateParam = (params: TradeTrendReqVO) => {
  return { times: [formatDate(params.times[0]), formatDate(params.times[1])] } as TradeTrendReqVO
}
