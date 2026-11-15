import request from '@/config/axios'

export interface DramaDialogueVO {
  characterId?: number // 发言人；旁白为空
  line: string
}

export interface DramaStoryboardVO {
  id: number
  projectId: number
  scriptId?: number
  sceneNo?: number
  title?: string
  shotType?: string
  cameraMove?: string
  duration?: number
  videoPrompt?: string
  dialogues?: DramaDialogueVO[]
  appearanceIds?: number[] // 引用的角色形象编号
  locationId?: number // 引用的场景编号
  visualAssetIds?: number[] // 引用的视觉资产编号
  firstFrameUrl?: string
  taskId?: string // 服务商任务编号
  videoStatus?: number
  videoUrl?: string
  videoModelId?: number
  errorMessage?: string
  createTime?: Date
  updateTime?: Date
}

// AI 短剧分镜 API
export const DramaStoryboardApi = {
  createStoryboard: async (data: any) => {
    return await request.post({ url: `/ai/drama/storyboard/create`, data })
  },
  updateStoryboard: async (data: any) => {
    return await request.put({ url: `/ai/drama/storyboard/update`, data })
  },
  deleteStoryboard: async (id: number) => {
    return await request.delete({ url: `/ai/drama/storyboard/delete?id=${id}` })
  },
  generateStoryboardVideo: async (id: number, modelId: number) => {
    return await request.post({ url: `/ai/drama/storyboard/generate-video`, data: { id, modelId } })
  },
  generateStoryboardVideoBatch: async (projectId: number, modelId: number): Promise<number> => {
    return await request.post({
      url: `/ai/drama/storyboard/generate-video-batch`,
      data: { id: projectId, modelId }
    })
  }
}
