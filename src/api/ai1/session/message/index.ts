import request from '@/config/axios'
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source'
import { getAccessToken, getTenantId } from '@/utils/auth'
import { config } from '@/config/axios/config'

/** AI1 会话消息信息 */
export interface SessionMessage {
  id: number // 编号
  sessionId: number // 会话编号
  role: string // 角色，参见 Ai1SessionMessageRoleEnum
  reasoning?: string // 思考过程
  content: string // 内容
  status: number // 状态，参见 Ai1SessionMessageStatusEnum
  createTime: Date // 创建时间
}

/** AI1 会话消息 SSE 事件 */
export interface SessionStreamEvent {
  event: string // 事件类型，参见 Ai1SessionStreamEventEnum
  data: string // 事件数据
  id?: string // 事件编号，断线后携带它续传
}

/** AI1 会话消息 SSE 回调 */
export interface SessionStreamHandlers {
  onEvent: (event: SessionStreamEvent) => void // 收到事件
  onError: (error: any) => void // 请求失败
  onClose: () => void // 连接关闭
}

/** 打开 SSE 连接：携带登录令牌与租户编号 */
const openSessionStream = (
  url: string,
  body: object | undefined,
  controller: AbortController,
  handlers: SessionStreamHandlers
) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAccessToken()}`
  }
  const tenantId = getTenantId()
  if (import.meta.env.VITE_APP_TENANT_ENABLE === 'true' && tenantId) {
    headers['tenant-id'] = String(tenantId)
  }
  return fetchEventSource(`${config.base_url}${url}`, {
    method: 'post',
    headers,
    openWhenHidden: true,
    body: body ? JSON.stringify(body) : undefined,
    signal: controller.signal,
    onopen: async (response) => {
      if (
        response.ok &&
        response.headers.get('content-type')?.toLowerCase().startsWith(EventStreamContentType)
      ) {
        return
      }
      // 校验、权限等错误可能返回 JSON，交给现有 error 事件展示并终止断线重试
      let errorMessage = response.ok
        ? '会话响应格式异常，请稍后重试'
        : `会话请求失败（HTTP ${response.status}），请稍后重试`
      try {
        const result = await response.json()
        if (typeof result?.msg === 'string' && result.msg.trim()) {
          errorMessage = result.msg
        }
      } catch {}
      handlers.onEvent({ event: 'error', data: errorMessage })
      throw new Error(errorMessage)
    },
    onmessage: (message) => {
      handlers.onEvent({
        event: message.event,
        data: message.data ? JSON.parse(message.data) : '',
        id: message.id || undefined
      })
    },
    onerror: handlers.onError,
    onclose: handlers.onClose
  })
}

// AI1 会话消息 API
export const SessionMessageApi = {
  // 获得【我的】会话消息列表
  getSessionMessageMyList: async (sessionId: number): Promise<SessionMessage[]> => {
    return await request.get({ url: `/ai1/session/message/my-list?sessionId=` + sessionId })
  },

  // 获得会话消息列表
  getSessionMessageList: async (sessionId: number): Promise<SessionMessage[]> => {
    return await request.get({ url: `/ai1/session/message/list?sessionId=` + sessionId })
  },

  // 发送消息（流式）；为什么不用 axios 呢？因为它不支持 SSE 调用
  sendSessionMessageStream: (
    sessionId: number,
    content: string,
    controller: AbortController,
    handlers: SessionStreamHandlers
  ) => {
    return openSessionStream(
      `/ai1/session/message/send-stream`,
      { sessionId, content },
      controller,
      handlers
    )
  },

  // 续传消息（流式）
  resumeSessionMessageStream: (
    messageId: number,
    lastEventId: string | undefined,
    controller: AbortController,
    handlers: SessionStreamHandlers
  ) => {
    const params = new URLSearchParams({ messageId: String(messageId) })
    if (lastEventId) {
      params.set('lastEventId', lastEventId)
    }
    return openSessionStream(
      `/ai1/session/message/resume-stream?${params.toString()}`,
      undefined,
      controller,
      handlers
    )
  }
}
