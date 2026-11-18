import request from '@/config/axios'

export interface DramaDialogueVO {
  characterId?: number // 发言人；旁白为空
  line: string
}

// 出场角色：引用一个形象，并指定站位
export interface DramaCharacterRefVO {
  appearanceId?: number
  slot?: string // 站位：取自场景的可站位置
}

// 表演指导
export interface DramaActingNoteVO {
  name: string // 角色名
  acting: string // 表演指令
}

// 连续性设置：只列出工作台编辑的字段，其它规划字段原样保留
export interface DramaContinuityVO {
  voiceSpeakerIds?: number[] // 参考音频的发言角色；为空时按台词的发言角色
  manualStartFrame?: { url?: string } // 手动起始帧：优先于关键帧
  useFirstFrame?: boolean // 是否使用起始帧生成视频：缺省是
  includeLocation?: boolean // 视频参考图是否包含场景图：缺省是
  referenceVideoUrls?: string[] // 动作参考视频
  materialUrls?: string[] // 素材图片：可直接渲染为镜头视频
  frameFocus?: string // 关键帧画面焦点
  keyframeDirective?: string // 关键帧导演指令
  [key: string]: any
}

export interface DramaStoryboardVO {
  id: number
  projectId: number
  scriptId?: number
  sceneNo?: number // 镜头序号
  title?: string
  sourceText?: string // 剧本原文
  sceneText?: string // 画面描述
  sceneType?: number
  shotType?: string
  cameraMove?: string
  duration?: number
  photographyRules?: Record<string, any>
  actingNotes?: DramaActingNoteVO[]
  imagePrompt?: string // 图片提示词：生成关键帧使用
  videoPrompt?: string
  dialogues?: DramaDialogueVO[]
  characters?: DramaCharacterRefVO[] // 出场角色
  locationId?: number // 引用的场景编号
  visualAssetIds?: number[] // 道具：为空时按道具关联的镜头序号，空数组表示没有道具
  continuity?: DramaContinuityVO
  taskId?: string // 服务商任务编号
  videoStatus?: number
  videoUrl?: string
  lastFrameUrl?: string // 镜头视频尾帧
  videoModelId?: number
  videoModel?: string
  videoResolution?: string
  errorMessage?: string
  planWarnings?: string[] // 规划提示：只在规划分镜时返回，例如角色指定的形象无法唯一匹配
  createTime?: Date
  updateTime?: Date
}

// 镜头视频提交记录
export interface DramaVideoSubmissionVO {
  id: number
  requestId: string // 请求编号：前端每次点击生成
  storyboardId: number
  parametersHash: string // 提交参数的 SHA-256
  modelId?: number
  model?: string // 提交时的视频模型
  taskId?: string // 服务商任务编号：为空且待处理时，提交结果未知
  status: number // 参见 AiDramaStatusEnum
  videoUrl?: string
  lastFrameUrl?: string
  errorMessage?: string
  previousVideo?: {
    taskId?: string
    videoStatus?: number
    videoUrl?: string
    lastFrameUrl?: string
  }
  createTime: Date
}

// 镜头声音预览：生成镜头视频时使用的发言角色、参考音频
export interface DramaStoryboardVoiceVO {
  explicit: boolean // 是否手动指定了发言角色
  speakers: {
    characterId: number
    name: string
    voiceDescription?: string
    sampleAudioUrl?: string
  }[]
  referenceAudios: { url: string; description: string }[]
}

// AI 短剧分镜 API
export const DramaStoryboardApi = {
  // 新增分镜：返回分镜编号
  createStoryboard: async (data: any): Promise<number> => {
    return await request.post({ url: `/ai/drama/storyboard/create`, data })
  },
  updateStoryboard: async (data: any) => {
    return await request.put({ url: `/ai/drama/storyboard/update`, data })
  },
  deleteStoryboard: async (id: number) => {
    return await request.delete({ url: `/ai/drama/storyboard/delete?id=${id}` })
  },
  // 获得分镜：包括历史剧本版本的分镜；不存在时为空
  getStoryboard: async (id: number): Promise<DramaStoryboardVO | undefined> => {
    return await request.get({ url: `/ai/drama/storyboard/get?id=${id}` })
  },
  // 获得剧本版本的分镜列表：只读查看历史版本
  getStoryboardList: async (scriptId: number): Promise<DramaStoryboardVO[]> => {
    return await request.get({ url: `/ai/drama/storyboard/list?scriptId=${scriptId}` })
  },
  // 生成镜头视频：requestId 每次点击生成一个，网络重试时沿用
  generateStoryboardVideo: async (
    id: number,
    modelId: number,
    resolution?: string,
    requestId?: string
  ) => {
    return await request.post({
      url: `/ai/drama/storyboard/generate-video`,
      data: { id, modelId, resolution, requestId }
    })
  },
  generateStoryboardVideoBatch: async (
    projectId: number,
    modelId: number,
    resolution?: string
  ): Promise<number> => {
    return await request.post({
      url: `/ai/drama/storyboard/generate-video-batch`,
      data: { id: projectId, modelId, resolution }
    })
  },
  // 生成关键帧：有修正说明时，以当前关键帧为参考修正构图
  generateStoryboardFrame: async (id: number, modelId: number, revisePrompt?: string) => {
    return await request.post({
      url: `/ai/drama/storyboard/generate-frame`,
      data: { id, modelId, revisePrompt }
    })
  },
  // 承接上一镜头：上一镜头视频的尾帧作为本镜的起始帧
  usePreviousLastFrame: async (id: number) => {
    return await request.put({ url: `/ai/drama/storyboard/use-previous-last-frame?id=${id}` })
  },
  // 素材图片渲染为镜头视频
  renderStoryboardMaterial: async (id: number) => {
    return await request.post({ url: `/ai/drama/storyboard/render-material?id=${id}` })
  },
  // 批量生成关键帧：当前剧本中镜头序号在范围内、还没有关键帧的镜头
  generateStoryboardFrameBatch: async (data: {
    projectId: number
    modelId: number
    startSceneNo: number
    endSceneNo: number
  }): Promise<number> => {
    return await request.post({ url: `/ai/drama/storyboard/generate-frame-batch`, data })
  },
  // 导入外部视频为镜头视频
  importStoryboardVideo: async (id: number, fileUrl: string) => {
    return await request.post({ url: `/ai/drama/storyboard/import-video`, data: { id, fileUrl } })
  },

  // ========== 声音 ==========

  getStoryboardVoice: async (id: number): Promise<DramaStoryboardVoiceVO> => {
    return await request.get({ url: `/ai/drama/storyboard/get-voice?id=${id}` })
  },
  // 设置发言角色：为空时按台词自动识别
  updateStoryboardSpeakers: async (id: number, characterIds?: number[]) => {
    return await request.put({
      url: `/ai/drama/storyboard/update-speakers`,
      data: { id, characterIds }
    })
  },

  // ========== 视频提交记录 ==========

  getVideoSubmissionList: async (storyboardId: number): Promise<DramaVideoSubmissionVO[]> => {
    return await request.get({
      url: `/ai/drama/storyboard/video-submission/list?storyboardId=${storyboardId}`
    })
  },
  // 提交结果未知：填写在服务商控制台核对到的任务编号
  resolveVideoSubmission: async (id: number, taskId: string) => {
    return await request.put({
      url: `/ai/drama/storyboard/video-submission/resolve`,
      data: { id, taskId }
    })
  },
  // 提交结果未知：确认服务商未创建任务
  confirmVideoSubmissionFail: async (id: number) => {
    return await request.put({ url: `/ai/drama/storyboard/video-submission/confirm-fail?id=${id}` })
  },
  // 使用提交记录的视频：previous 为 true 时恢复提交前的视频
  useVideoSubmission: async (id: number, previous: boolean) => {
    return await request.put({
      url: `/ai/drama/storyboard/video-submission/use-video?id=${id}&previous=${previous}`
    })
  }
}
