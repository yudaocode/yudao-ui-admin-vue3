import request from '@/config/axios'

export interface SseConfigVO {
  sseEnabled: boolean // SSE 是否开启
  ssePath?: string // SSE 接口路径前缀
  sseHeartbeatInterval?: number // SSE 心跳间隔，单位：毫秒
  sseRetryInterval?: number // SSE 重连间隔，单位：毫秒
  websocketEnabled: boolean // WebSocket 是否开启
}

export interface SseDemoSendReqVO {
  toUserId?: number // 接收人编号，为空时发送给所有管理员
  text: string // 消息内容
}

// 获得 SSE 配置
export const getSseConfig = async () => {
  return await request.get<SseConfigVO>({ url: '/infra/sse/get-config' })
}

// 发送 SSE 演示消息，返回事件编号
export const sendSseDemo = async (data: SseDemoSendReqVO) => {
  return await request.post<string>({ url: '/infra/sse/send-demo', data })
}

// 关闭 SSE 连接。SSE 接口与 WebSocket 一样不带 /admin-api 前缀，所以 baseURL 使用 VITE_BASE_URL
export const closeSseConnection = async (connectionId: string, ssePath = '/infra/sse') => {
  return await request.post<boolean>({
    baseURL: import.meta.env.VITE_BASE_URL,
    url: `${ssePath}/close`,
    params: { connectionId }
  })
}
