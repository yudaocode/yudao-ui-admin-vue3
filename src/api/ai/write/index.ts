import { fetchEventSource } from '@microsoft/fetch-event-source'

import { getAccessToken } from '@/utils/auth'
import { config } from '@/config/axios/config'
import { AiWriteTypeEnum } from '@/views/ai/utils/constants'
import request from '@/config/axios'

export interface WriteVO {
  type: AiWriteTypeEnum.WRITING | AiWriteTypeEnum.REPLY // 1:撰写 2:回复
  prompt: string // 写作内容提示 1。撰写 2回复
  originalContent: string // 原文
  length: number // 长度
  format: number // 格式
  tone: number // 语气
  language: number // 语言
  userId?: number // 用户编号
  platform?: string // 平台
  model?: string // 模型
  generatedContent?: string // 生成的内容
  errorMessage?: string // 错误信息
  createTime?: Date // 创建时间
}

export interface AiWritePageReqVO extends PageParam {
  userId?: number // 用户编号
  type?: AiWriteTypeEnum //  写作类型
  platform?: string // 平台
  createTime?: [string, string] // 创建时间
}

export interface AiWriteRespVo {
  id: number
  userId: number
  type: number
  platform: string
  model: string
  prompt: string
  generatedContent: string
  originalContent: string
  length: number
  format: number
  tone: number
  language: number
  errorMessage: string
  createTime: string
}

export const WriteApi = {
  writeStream: ({
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
  },
  // 获取写作列表
  getWritePage: (params: AiWritePageReqVO) => {
    return request.get<PageResult<AiWriteRespVo[]>>({ url: `/ai/write/page`, params })
  },
  // 删除写作
  deleteWrite(id: number) {
    return request.delete({ url: `/ai/write/delete`, params: { id } })
  }
}
