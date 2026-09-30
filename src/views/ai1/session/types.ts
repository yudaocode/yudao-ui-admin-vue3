import type { SessionMessage } from '@/api/ai1/session/message'

/** AI1 会话页的消息 */
export interface Ai1SessionMessageItem extends SessionMessage {
  errorMessage?: string // 错误提示
  interrupted?: boolean // 是否已中断接收
}
