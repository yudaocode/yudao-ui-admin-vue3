import request from '@/config/axios'
import dayjs from 'dayjs'
import { DataComparisonRespVO } from '@/api/mall/statistics/common'
import { formatDate } from '@/utils/formatTime'

/** 会员分析 Request VO */
export interface MemberAnalyseReqVO {
  times: dayjs.ConfigType[]
}

/** 会员分析 Response VO */
export interface MemberAnalyseRespVO {
  visitUserCount: number
  orderUserCount: number
  payUserCount: number
  atv: number
  comparison: DataComparisonRespVO<MemberAnalyseComparisonRespVO>
}

/** 会员分析对照数据 Response VO */
export interface MemberAnalyseComparisonRespVO {
  registerUserCount: number
  visitUserCount: number
  rechargeUserCount: number
}

/** 会员地区统计 Response VO */
export interface MemberAreaStatisticsRespVO {
  areaId: number
  areaName: string
  userCount: number
  orderCreateUserCount: number
  orderPayUserCount: number
  orderPayPrice: number
}

/** 会员性别统计 Response VO */
export interface MemberSexStatisticsRespVO {
  sex: number
  userCount: number
}

/** 会员统计 Response VO */
export interface MemberSummaryRespVO {
  userCount: number
  rechargeUserCount: number
  rechargePrice: number
  expensePrice: number
}

/** 会员终端统计 Response VO */
export interface MemberTerminalStatisticsRespVO {
  terminal: number
  userCount: number
}

/** 会员数量统计 Response VO */
export interface MemberCountRespVO {
  /** 用户访问量 */
  visitUserCount: string
  /** 注册用户数量 */
  registerUserCount: number
}

/** 会员注册数量 Response VO */
export interface MemberRegisterCountRespVO {
  date: string
  count: number
}

// 查询会员统计
export const getMemberSummary = () => {
  return request.get<MemberSummaryRespVO>({
    url: '/statistics/member/summary'
  })
}

// 查询会员分析数据
export const getMemberAnalyse = (params: MemberAnalyseReqVO) => {
  return request.get<MemberAnalyseRespVO>({
    url: '/statistics/member/analyse',
    params: { times: [formatDate(params.times[0]), formatDate(params.times[1])] }
  })
}

// 按照省份，查询会员统计列表
export const getMemberAreaStatisticsList = () => {
  return request.get<MemberAreaStatisticsRespVO[]>({
    url: '/statistics/member/area-statistics-list'
  })
}

// 按照性别，查询会员统计列表
export const getMemberSexStatisticsList = () => {
  return request.get<MemberSexStatisticsRespVO[]>({
    url: '/statistics/member/sex-statistics-list'
  })
}

// 按照终端，查询会员统计列表
export const getMemberTerminalStatisticsList = () => {
  return request.get<MemberTerminalStatisticsRespVO[]>({
    url: '/statistics/member/terminal-statistics-list'
  })
}

// 获得用户数量量对照
export const getUserCountComparison = () => {
  return request.get<DataComparisonRespVO<MemberCountRespVO>>({
    url: '/statistics/member/user-count-comparison'
  })
}

// 获得会员注册数量列表
export const getMemberRegisterCountList = (
  beginTime: dayjs.ConfigType,
  endTime: dayjs.ConfigType
) => {
  return request.get<MemberRegisterCountRespVO[]>({
    url: '/statistics/member/register-count-list',
    params: { times: [formatDate(beginTime), formatDate(endTime)] }
  })
}
