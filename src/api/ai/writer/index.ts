import request from '@/config/axios'
import { fetchEventSource } from '@microsoft/fetch-event-source'

import { getAccessToken } from '@/utils/auth'
import { config } from '@/config/axios/config'

export interface WriteParams {
  /**
   * 1:撰写 2:回复
   */
  type: 1 | 2
  /**
   * 写作内容提示 1。撰写 2回复
   */
  prompt: string
  /**
   *  原文
   */
  originalContent: string
  /**
   * 长度
   */
  length: number
  /**
   * 格式
   */
  format: number
  /**
   * 语气
   */
  tone: number
  /**
   * 语言
   */
  language: number
}
export const writeStream = (data: WriteParams, onMessage, onError, onClose, ctrl) => {
  // return request.post({ url: '/ai/write/generate-stream', data })
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
