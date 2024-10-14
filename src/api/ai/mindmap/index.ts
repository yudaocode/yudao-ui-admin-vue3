import { getAccessToken } from '@/utils/auth'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { config } from '@/config/axios/config'
import request from '@/config/axios' // AI 思维导图 VO

// AI 思维导图 VO
export interface MindMapVO {
  id: number // 编号
  userId: number // 用户编号
  prompt: string // 生成内容提示
  generatedContent: string // 生成的思维导图内容
  platform: string // 平台
  model: string // 模型
  errorMessage: string // 错误信息
}

// AI 思维导图生成 VO
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
  },

  // 查询思维导图分页
  getMindMapPage: async (params: any) => {
    return await request.get({ url: `/ai/mind-map/page`, params })
  },
  // 删除思维导图
  deleteMindMap: async (id: number) => {
    return await request.delete({ url: `/ai/mind-map/delete?id=` + id })
  }
}
