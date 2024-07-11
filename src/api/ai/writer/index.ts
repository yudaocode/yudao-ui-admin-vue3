import { fetchEventSource } from '@microsoft/fetch-event-source'
import request from '@/config/axios'

import { getAccessToken } from '@/utils/auth'
import { config } from '@/config/axios/config'
import { AiWriteTypeEnum } from '@/views/ai/utils/constants'

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
  errorMessage: string // 错误信息
  createTime?: Date // 创建时间
}

// TODO @hhero：搞成 WriteApi，类似 ConversationApi 一样。这样更有类的概念，后续引入某个 Api，然后调用它的方法就可以了。
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

// AI 写作 API
export const WriteApi = {
  // 查询AI 写作分页
  getWritePage: async (params: any) => {
    return await request.get({ url: `/ai/write/page`, params })
  },

  // 删除AI 写作
  deleteWrite: async (id: number) => {
    return await request.delete({ url: `/ai/write/delete?id=` + id })
  }
}
