import { fetchEventSource } from '@microsoft/fetch-event-source'

import request from '@/config/axios'
import { config } from '@/config/axios/config'
import { getAccessToken, getTenantId, getVisitTenantId } from '@/utils/auth'
import type { DramaStoryboardVO } from '@/api/ai/drama/storyboard'

// AI 短剧剧本 VO
export interface DramaScriptVO {
  id: number
  projectId: number
  title?: string
  tone?: string // 叙事基调
  outline?: string
  content?: string
  source?: number // 来源，参见 AiDramaScriptSourceEnum
  creationMode?: number // 创作模式，参见 AiDramaScriptCreationModeEnum
  sourceMaterial?: string // 原始素材
  worldbuilding?: string // 世界观设定
  revisionNote?: string // 本版本的修改说明
  createTime?: Date
}

const GENERATE_TIMEOUT = 5 * 60 * 1000 // 同步调用模型生成，超时时间放宽到 5 分钟

/**
 * 流式请求的身份头：与 axios 请求拦截器（src/config/axios/service.ts）的条件一致
 *
 * 1. 有访问令牌时带 Authorization
 * 2. 开启租户时带 tenant-id；已登录（带 Authorization）且选了访问租户时，再带 visit-tenant-id
 */
const buildStreamHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const accessToken = getAccessToken()
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }
  if (import.meta.env.VITE_APP_TENANT_ENABLE === 'true') {
    const tenantId = getTenantId()
    if (tenantId) {
      headers['tenant-id'] = String(tenantId)
    }
    const visitTenantId = getVisitTenantId()
    if (headers.Authorization && visitTenantId) {
      headers['visit-tenant-id'] = String(visitTenantId)
    }
  }
  return headers
}

// 从故事想法创建项目 Request VO：项目设置与故事想法；名称为空时使用生成的剧名
export interface DramaScriptCreateReqVO {
  name?: string
  description?: string
  idea: string
  style?: number
  aestheticSkillId?: number
  directorSkillId?: number
  storyboardSkillIds?: number[]
  composeAspectRatio?: string
  modelId?: number
}

// AI 短剧剧本 API
export const DramaScriptApi = {
  // 保存剧本：指定编号时更新该版本，未指定时新增版本；返回剧本编号
  updateScript: async (data: any): Promise<number> => {
    return await request.put({ url: `/ai/drama/script/update`, data })
  },
  getScriptList: async (projectId: number): Promise<DramaScriptVO[]> => {
    return await request.get({ url: `/ai/drama/script/list?projectId=${projectId}` })
  },
  generateScript: async (projectId: number, modelId?: number): Promise<DramaScriptVO> => {
    return await request.post({
      url: `/ai/drama/script/generate`,
      data: { projectId, modelId },
      timeout: GENERATE_TIMEOUT
    })
  },
  polishScript: async (
    projectId: number,
    note: string,
    modelId?: number
  ): Promise<DramaScriptVO> => {
    return await request.post({
      url: `/ai/drama/script/polish`,
      data: { projectId, note, modelId },
      timeout: GENERATE_TIMEOUT
    })
  },
  analyzeAssetList: async (projectId: number, modelId?: number) => {
    return await request.post({
      url: `/ai/drama/script/analyze-asset-list`,
      data: { projectId, modelId },
      timeout: GENERATE_TIMEOUT
    })
  },
  generateStoryboardList: async (projectId: number, modelId?: number) => {
    return await request.post({
      url: `/ai/drama/script/generate-storyboard-list`,
      data: { projectId, modelId },
      timeout: GENERATE_TIMEOUT
    })
  },
  // 规划分镜：只返回不保存，审阅后导入
  planStoryboardList: async (projectId: number, modelId?: number): Promise<DramaStoryboardVO[]> => {
    return await request.post({
      url: `/ai/drama/script/plan-storyboard-list`,
      data: { projectId, modelId },
      timeout: GENERATE_TIMEOUT
    })
  },
  // 导入审阅后的分镜：替换当前剧本的分镜
  importStoryboardList: async (data: {
    projectId: number
    scriptId: number
    storyboards: any[]
  }) => {
    return await request.post({ url: `/ai/drama/script/import-storyboard-list`, data })
  },
  generatePhotographyRules: async (projectId: number, modelId?: number) => {
    return await request.post({
      url: `/ai/drama/script/generate-photography-rules`,
      data: { projectId, modelId },
      timeout: GENERATE_TIMEOUT
    })
  },
  generateActingNotes: async (projectId: number, modelId?: number) => {
    return await request.post({
      url: `/ai/drama/script/generate-acting-notes`,
      data: { projectId, modelId },
      timeout: GENERATE_TIMEOUT
    })
  },
  // 从故事想法创建项目：流式生成初版剧本；data 生成中为增量文本 content，最后一条为项目编号 projectId
  createProjectStream: ({
    data,
    onMessage,
    onError,
    onClose,
    ctrl
  }: {
    data: DramaScriptCreateReqVO
    onMessage?: (res: any) => void
    onError?: (...args: any[]) => void
    onClose?: (...args: any[]) => void
    ctrl: AbortController
  }) => {
    return fetchEventSource(`${config.base_url}/ai/drama/script/create-stream`, {
      method: 'post',
      headers: buildStreamHeaders(),
      openWhenHidden: true,
      body: JSON.stringify(data),
      onmessage: onMessage,
      onerror: onError,
      onclose: onClose,
      signal: ctrl.signal
    })
  },
  // 规划关键帧：生成关键帧画面描述与画面焦点
  planFrameList: async (projectId: number, modelId?: number) => {
    return await request.post({
      url: `/ai/drama/script/plan-frame-list`,
      data: { projectId, modelId },
      timeout: GENERATE_TIMEOUT
    })
  }
}
