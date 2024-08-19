import { getAccessToken } from '@/utils/auth'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { config } from '@/config/axios/config'

export interface AiMindMapGenerateReqVO {
  prompt: string
}

export const AiMindMapApi = {
  generateMindMap: ({
    data,
    onClose,
    onMessage,
    onError,
    ctrl
  }: {
    data: AiMindMapGenerateReqVO
    onMessage?: (res: any) => void
    onError?: (...args: any[]) => void
    onClose?: (...args: any[]) => void
    ctrl: AbortController
  }) => {
    const token = getAccessToken()
    return fetchEventSource(`${config.base_url}/ai/mind-map/generate-stream`, {
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
}
