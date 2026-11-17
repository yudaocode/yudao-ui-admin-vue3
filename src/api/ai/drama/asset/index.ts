import request from '@/config/axios'

export interface DramaAudioVO {
  id: number
  projectId: number
  characterId?: number
  type: number // 参见 AiDramaAudioTypeEnum
  name?: string
  text?: string
  voice?: string
  storyboardId?: number // 对白所属的分镜
  duration?: number // 时长（秒）
  fileUrl: string
  storyboardIds?: number[] // 使用的分镜：配乐、参考音频；为空表示候选
  volume?: number // 音量（0-2）
  startOffset?: number // 起始偏移（秒）
  musicId?: number // 来源的 AI 音乐编号
  createTime?: Date
}

// 动作参考视频
export interface DramaMotionReferenceVO {
  id: number
  projectId: number
  name: string
  fileUrl: string
  duration?: number // 时长（秒）
  createTime?: Date
}

export interface DramaAppearanceVO {
  id: number
  characterId: number
  appearanceIndex: number // 形象序号，从 0 开始
  changeReason?: string // 变化原因
  description?: string
  referenceImageUrl?: string
  imageUrls?: string[] // 候选图
  imageDescriptions?: string[] // 候选图的提示词，与候选图一一对应
  selectedIndex?: number // 选用的候选图下标
  previousImageUrls?: string[] // 上一版候选图：不为空时可撤销
  modelId?: number
  status?: number
  errorMessage?: string
  updateTime?: Date
}

export interface DramaCharacterVO {
  id: number
  projectId: number
  name: string
  aliases?: string // 别名
  roleLevel?: string // 角色等级，参见 AiDramaCharacterRoleLevelEnum
  sex?: number
  ageRange?: string
  personalityTags?: string[]
  costumeTier?: number // 服装档次，参见 AiDramaCharacterCostumeTierEnum
  description?: string
  prompt?: string
  referenceImageUrl?: string
  voiceDescription?: string // 声音描述
  sampleText?: string // 样音文本
  sampleAudioId?: number // 选用的样音编号
  appearances: DramaAppearanceVO[]
  audios: DramaAudioVO[]
}

export interface DramaLocationVO {
  id: number
  projectId: number
  name: string
  description?: string
  crowd?: boolean // 是否有群演
  crowdDescription?: string
  availableSlots?: string[] // 可站位置
  descriptions?: string[]
  referenceImageUrl?: string
  imageUrls?: string[]
  imageDescriptions?: string[]
  selectedIndex?: number
  previousImageUrls?: string[]
  modelId?: number
  status?: number
  errorMessage?: string
  updateTime?: Date
}

// 视觉资产的参考图：道具使用 referenceImageUrl、shotNumbers；关键帧使用 urls、propsVersion、previousImageUrl
export interface DramaReferenceImagesVO {
  shotNumbers?: number[] // 道具出现的镜头序号
  referenceImageUrl?: string
  urls?: string[]
  propsVersion?: string
  previousImageUrl?: string
}

export interface DramaVisualAssetVO {
  id: number
  projectId: number
  storyboardId?: number // 关键帧所属的分镜
  parentId?: number // 历史版本指向当前版本；当前版本为空
  kind: number // 参见 AiDramaVisualAssetKindEnum
  title?: string
  prompt?: string
  referenceImages?: DramaReferenceImagesVO
  imageUrl?: string
  modelId?: number
  model?: string
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
  deleteAppearanceCandidate: async (id: number, index: number) => {
    return await request.delete({
      url: `/ai/drama/asset/appearance/delete-candidate?id=${id}&index=${index}`
    })
  },
  undoAppearanceImage: async (id: number) => {
    return await request.put({ url: `/ai/drama/asset/appearance/undo-image?id=${id}` })
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
  deleteLocationCandidate: async (id: number, index: number) => {
    return await request.delete({
      url: `/ai/drama/asset/location/delete-candidate?id=${id}&index=${index}`
    })
  },
  undoLocationImage: async (id: number) => {
    return await request.put({ url: `/ai/drama/asset/location/undo-image?id=${id}` })
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
  // 撤销道具、关键帧的上次出图：与最近的历史版本互换
  undoVisualAssetImage: async (id: number) => {
    return await request.put({ url: `/ai/drama/asset/visual-asset/undo-image?id=${id}` })
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
    name?: string
    fileUrl: string
    duration?: number
    storyboardIds?: number[]
  }) => {
    return await request.post({ url: `/ai/drama/asset/audio/create`, data })
  },
  // 修改配乐、参考音频：名称、使用的分镜、音量、起始偏移
  updateAudio: async (data: {
    id: number
    name?: string
    storyboardIds?: number[]
    volume?: number
    startOffset?: number
  }) => {
    return await request.put({ url: `/ai/drama/asset/audio/update`, data })
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
  },
  // 选用 AI 音乐为配乐
  createMusicAudio: async (data: {
    projectId: number
    musicId: number
    storyboardIds?: number[]
  }) => {
    return await request.post({ url: `/ai/drama/asset/audio/create-music`, data })
  },

  // ========== 动作参考 ==========

  createMotionReference: async (data: { projectId: number; name: string; fileUrl: string }) => {
    return await request.post({ url: `/ai/drama/asset/motion-reference/create`, data })
  },
  deleteMotionReference: async (id: number) => {
    return await request.delete({ url: `/ai/drama/asset/motion-reference/delete?id=${id}` })
  }
}
