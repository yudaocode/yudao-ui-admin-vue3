import { fetchEventSource } from '@microsoft/fetch-event-source'

import { getAccessToken } from '@/utils/auth'
import { config } from '@/config/axios/config'

export interface WriteVO {
  type: 1 | 2 // 1:撰写 2:回复
  prompt: string // 写作内容提示 1。撰写 2回复
  originalContent: string // 原文
  length: number // 长度
  format: number // 格式
  tone: number // 语气
  language: number // 语言
}

export const writeStream = ({
  data,
  onClose,
  onMessage,
  onError,
  ctrl
}: {
  data: WriteVO
  onMessage?: (res: any) => void
  onError?: (...args: any[]) => void
  onClose?: (...args: any[]) => void
  ctrl: AbortController
}) => {
  const token = getAccessToken()
  return fetchEventSource(`${config.base_url}/ai/write/generate-stream`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    openWhenHidden: true,
    body: JSON.stringify(data),
    onmessage: onMessage,
    onerror: onError,
    onclose: onClose,
    signal: ctrl.signal
  })
}
