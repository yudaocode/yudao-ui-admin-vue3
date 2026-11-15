import request from '@/config/axios'

// AI 短剧剧本 VO
export interface DramaScriptVO {
  id: number
  projectId: number
  title?: string
  tone?: string
  outline?: string
  content?: string
  revisionNotes?: { note: string; time: number }[] // 修改意见；time 为时间戳
  createTime?: Date
}

const GENERATE_TIMEOUT = 5 * 60 * 1000 // 同步调用模型生成，超时时间放宽到 5 分钟

// AI 短剧剧本 API
export const DramaScriptApi = {
  updateScript: async (data: any) => {
    return await request.put({ url: `/ai/drama/script/update`, data })
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
  }
}
