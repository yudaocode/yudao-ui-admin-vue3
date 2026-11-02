import request from '@/config/axios'

// AI 请求日志 VO
export interface RequestLogVO {
  id: number // 编号
  requestId: string // 请求编号（服务端生成的 UUID）
  userId: number // 用户编号
  userNickname?: string | null // 用户昵称，用户不存在时为空
  bizType: number // 业务类型，参见 ai_request_log_biz_type 字典
  bizId?: number | null // 业务编号
  platform: string // 模型平台
  modelId?: number | null // 模型编号
  model: string // 模型标识
  status: number // 状态，参见 ai_request_log_status 字典
  errorMessage?: string | null // 错误信息
  beginTime: number // 开始时间
  endTime?: number | null // 结束时间
  duration?: number | null // 耗时（毫秒）
  inputTokens?: number | null // 输入 Token，未知为 null
  outputTokens?: number | null // 输出 Token，未知为 null
  totalTokens?: number | null // 合计 Token，未知为 null
  responseMetadata?: Record<string, any> | null // 响应元数据（JSON 对象）
  createTime: number // 创建时间
}

// AI 请求日志统计 VO
export interface RequestLogStatisticsVO {
  requestCount: number // 请求总数
  successCount: number // 成功数
  failCount: number // 失败数
  cancelCount: number // 取消数
  inputTokens?: number | null // 已知输入 Token 合计
  outputTokens?: number | null // 已知输出 Token 合计
  totalTokens?: number | null // 完整用量的合计 Token
  knownUsageCount: number // 完整用量条数
  unknownUsageCount: number // 用量未知条数
}

// AI 请求日志 API
export const RequestLogApi = {
  // 查询请求日志分页
  getRequestLogPage: async (params: any): Promise<PageResult<RequestLogVO[]>> => {
    return await request.get({ url: `/ai/request-log/page`, params })
  },

  // 查询请求日志详情
  getRequestLog: async (id: number): Promise<RequestLogVO> => {
    return await request.get({ url: `/ai/request-log/get?id=` + id })
  },

  // 查询请求日志统计
  getRequestLogStatistics: async (params: any): Promise<RequestLogStatisticsVO> => {
    return await request.get({ url: `/ai/request-log/statistics`, params })
  }
}
