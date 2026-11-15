import request from '@/config/axios'

// 候选图：角色形象、场景共用
export interface DramaCandidateVO {
  url?: string // 图片地址；生成中、已失败时为空
  description?: string // 生成时的提示词
  modelId?: number // 绘画模型编号
}

export interface DramaAudioVO {
  id: number
  projectId: number
  characterId?: number
  type: number // 参见 AiDramaAudioTypeEnum
  fileUrl: string
  createTime?: Date
}

export interface DramaAppearanceVO {
  id: number
  characterId: number
  appearanceIndex: number
  description?: string
  prompt?: string
  candidates?: DramaCandidateVO[]
  selectedIndex?: number
  status?: number
  errorMessage?: string
  updateTime?: Date
}

export interface DramaCharacterVO {
  id: number
  projectId: number
  name: string
  description?: string
  prompt?: string
  referenceImageUrl?: string
  appearances: DramaAppearanceVO[]
  audios: DramaAudioVO[]
}

export interface DramaLocationVO {
  id: number
  projectId: number
  name: string
  description?: string
  prompt?: string
  candidates?: DramaCandidateVO[]
  selectedIndex?: number
  referenceImageUrl?: string
  status?: number
  errorMessage?: string
  updateTime?: Date
}

export interface DramaVisualAssetVO {
  id: number
  projectId: number
  kind?: string
  title: string
  prompt?: string
  imageUrl?: string
  modelId?: number
  taskId?: string
  status?: number
  errorMessage?: string
  updateTime?: Date
}

const GENERATE_TIMEOUT = 5 * 60 * 1000 // 同步调用模型生成，超时时间放宽到 5 分钟

// AI 短剧资产 API：角色、角色形象、场景、视觉资产、音频
export const DramaAssetApi = {
  createCharacter: async (data: any) => {
    return await request.post({ url: `/ai/drama/asset/character/create`, data })
  },
  updateCharacter: async (data: any) => {
    return await request.put({ url: `/ai/drama/asset/character/update`, data })
  },
  deleteCharacter: async (id: number) => {
    return await request.delete({ url: `/ai/drama/asset/character/delete?id=${id}` })
  },
  createAppearance: async (data: any) => {
    return await request.post({ url: `/ai/drama/asset/appearance/create`, data })
  },
  updateAppearance: async (data: any) => {
    return await request.put({ url: `/ai/drama/asset/appearance/update`, data })
  },
  deleteAppearance: async (id: number) => {
    return await request.delete({ url: `/ai/drama/asset/appearance/delete?id=${id}` })
  },
  generateAppearanceImage: async (id: number, modelId: number) => {
    return await request.post({
      url: `/ai/drama/asset/appearance/generate-image`,
      data: { id, modelId }
    })
  },
  createLocation: async (data: any) => {
    return await request.post({ url: `/ai/drama/asset/location/create`, data })
  },
  updateLocation: async (data: any) => {
    return await request.put({ url: `/ai/drama/asset/location/update`, data })
  },
  deleteLocation: async (id: number) => {
    return await request.delete({ url: `/ai/drama/asset/location/delete?id=${id}` })
  },
  generateLocationImage: async (id: number, modelId: number) => {
    return await request.post({
      url: `/ai/drama/asset/location/generate-image`,
      data: { id, modelId }
    })
  },
  createVisualAsset: async (data: any) => {
    return await request.post({ url: `/ai/drama/asset/visual-asset/create`, data })
  },
  updateVisualAsset: async (data: any) => {
    return await request.put({ url: `/ai/drama/asset/visual-asset/update`, data })
  },
  deleteVisualAsset: async (id: number) => {
    return await request.delete({ url: `/ai/drama/asset/visual-asset/delete?id=${id}` })
  },
  generateVisualAssetImage: async (id: number, modelId: number) => {
    return await request.post({
      url: `/ai/drama/asset/visual-asset/generate-image`,
      data: { id, modelId }
    })
  },
  generateMissingImages: async (projectId: number, modelId: number): Promise<number> => {
    return await request.post({
      url: `/ai/drama/asset/generate-missing-images`,
      data: { id: projectId, modelId }
    })
  },
  createAudio: async (data: {
    projectId: number
    characterId?: number
    type: number
    fileUrl: string
  }) => {
    return await request.post({ url: `/ai/drama/asset/audio/create`, data })
  },
  generateAudio: async (data: any) => {
    return await request.post({
      url: `/ai/drama/asset/audio/generate`,
      data,
      timeout: GENERATE_TIMEOUT
    })
  },
  selectAudio: async (id: number) => {
    return await request.put({ url: `/ai/drama/asset/audio/select?id=${id}` })
  },
  deleteAudio: async (id: number) => {
    return await request.delete({ url: `/ai/drama/asset/audio/delete?id=${id}` })
  }
}
