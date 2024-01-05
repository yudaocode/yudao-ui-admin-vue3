import request from '@/config/axios'

export type OperateLogVO = {
  id: number
  userNickname: string
  traceId: string
  userId: number
  module: string
  name: string
  type: number
  content: string
  exts: Map<String, Object>
  requestMethod: string
  requestUrl: string
  userIp: string
  userAgent: string
  javaMethod: string
  javaMethodArgs: string
  startTime: Date
  duration: number
  resultCode: number
  resultMsg: string
  resultData: string
}

export type OperateLogV2VO = {
  id: number
  userNickname: string
  traceId: string
  userType: number
  userId: number
  userName: string
  type: string
  subType: string
  bizId: number
  action: string
  extra: string
  requestMethod: string
  requestUrl: string
  userIp: string
  userAgent: string
  creator: string
  creatorName: string
  createTime: Date
  // 数据扩展，渲染时使用
  title: string // 操作标题（如果为空则取 name 值）
  colSize: number // 变更记录行数
  contentStrList: string[]
  tagsContentList: string[]
}

// 查询操作日志列表
export const getOperateLogPage = (params: PageParam) => {
  return request.get({ url: '/system/operate-log/page', params })
}
// 导出操作日志
export const exportOperateLog = (params) => {
  return request.download({ url: '/system/operate-log/export', params })
}
