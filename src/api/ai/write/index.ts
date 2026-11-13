import { fetchEventSource } from '@microsoft/fetch-event-source'

import { getAccessToken } from '@/utils/auth'
import { config } from '@/config/axios/config'
import { AiWriteTypeEnum } from '@/views/ai/utils/constants'
import request from '@/config/axios'

// 写作场景参数：只在部分场景使用，服务端只保存本场景的键
export interface AiWriteSceneParams {
  period?: string // 周报：周期
  role?: string // 周报：岗位 / 团队
  audience?: string // 小红书：目标受众
  style?: string // 小红书：风格
  emoji?: boolean // 小红书：是否使用 emoji
  tagCount?: number // 小红书：话题标签数
  mode?: string // 润色 / 改写：处理方式
  sourceLanguage?: number // 翻译：源语言，1 为自动检测（字典 ai_write_language）
  targetLanguage?: number // 翻译：目标语言（字典 ai_write_language）
  domain?: string // 翻译：领域
  preserveFormat?: boolean // 翻译：是否保留格式
}

export interface WriteVO {
  type: AiWriteTypeEnum // 写作场景
  modelId?: number // 模型编号，必须为启用的对话模型
  prompt: string // 写作主题 / 要求 / 回复要点 / 补充说明（按场景）
  originalContent: string // 原文 / 本周完成事项（按场景）
  length?: number // 长度
  format?: number // 格式
  tone?: number // 语气
  language?: number // 输出语言
  sceneParams?: AiWriteSceneParams // 场景参数
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
  sceneParams?: AiWriteSceneParams | null // 场景参数，旧记录为 null
  errorMessage: string
  inputTokens?: number | null // 输入 Token，未知为 null
  outputTokens?: number | null // 输出 Token，未知为 null
  totalTokens?: number | null // 合计 Token，未知为 null
  createTime: string
}

// AI 写作流式生成的单帧数据：CommonResult.data
export interface AiWriteGenerateRespVO {
  id: number // 写作编号
  content: string // 本次增量内容；仅携带用量的尾帧为空字符串
  inputTokens: number | null // 输入 Token 快照，未知为 null
  outputTokens: number | null // 输出 Token 快照，未知为 null
  totalTokens: number | null // 合计 Token 快照，未知为 null
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
