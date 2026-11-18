import request from '@/config/axios'

// AI 视频其它生成参数：只有部分服务商支持，按模型开放，不支持的不传
export interface VideoOptionsVO {
  size?: string // 尺寸（通义万相旧版文生）
  seed?: number // 随机种子
  watermark?: boolean // 是否添加水印
  generateAudio?: boolean // 是否生成音频
  cameraFixed?: boolean // 是否固定镜头（豆包 Seedance）
  negativePrompt?: string // 反向提示词（可灵、通义万相）
  promptExtend?: boolean // 是否自动优化提示词（通义万相、MiniMax 海螺）
  promptExpansionMode?: string // 提示词扩写模式（MiniMax-H3）
  quality?: string // 生成模式 std / pro（可灵旧版）
  shotType?: string // 镜头类型（通义万相）
  outputResolution?: number // 输出分辨率（即梦数字人）
}

// AI 视频 VO
export interface VideoVO {
  id: number // 编号
  userId: number // 用户编号
  userNickname?: string // 用户昵称
  type: number // 创作类型，参见 AiVideoTypeEnum
  mode?: string // 生成方式，参见 AiVideoModeEnum
  platform: string // 平台
  modelId: number // 模型编号
  model: string // 模型标识
  apiKeyId?: number // API 密钥编号
  apiKeyName?: string // API 密钥名称，仅管理端详情返回
  prompt?: string // 提示词
  resolution?: string // 分辨率
  ratio?: string // 画面比例
  duration?: number // 时长（秒）：未指定时，完成后取服务商返回的时长
  options?: VideoOptionsVO // 其它生成参数
  inputUrls?: Record<string, string[]> // 输入文件：本人与管理端返回
  status: number // 状态，参见 AiVideoStatusEnum
  progress?: number // 进度（0-100）
  taskId?: string // 服务商任务编号
  errorMessage?: string // 错误信息
  finishTime?: Date // 完成时间
  videoUrl?: string // 视频地址
  coverUrl?: string // 封面地址
  publicStatus: boolean // 是否公开
  createTime: Date // 创建时间
}

// AI 视频生成 Request VO
export interface VideoGenerateReqVO {
  type: number // 创作类型
  mode?: string // 生成方式（视频生成）
  modelId: number // 模型编号
  prompt?: string // 提示词
  resolution?: string // 分辨率
  ratio?: string // 画面比例
  duration?: number // 时长（秒）
  options?: VideoOptionsVO // 其它生成参数
  inputUrls?: Record<string, string[]> // 输入文件：键为角色
}

// AI 视频 API
export const VideoApi = {
  // ========== 创作 ==========

  // 生成视频
  generateVideo: async (data: VideoGenerateReqVO): Promise<number> => {
    return await request.post({ url: '/ai/video/generate', data })
  },

  // ========== 我的作品、公开作品 ==========

  // 获得【我的】视频分页
  getVideoMyPage: async (params: any) => {
    return await request.get({ url: '/ai/video/my-page', params })
  },

  // 获得公开作品分页
  getVideoPublicPage: async (params: any) => {
    return await request.get({ url: '/ai/video/public-page', params })
  },

  // 获得视频详情（本人，或已公开）
  getVideoDetail: async (id: number): Promise<VideoVO> => {
    return await request.get({ url: '/ai/video/get-detail?id=' + id })
  },

  // 删除【我的】视频
  deleteVideoMy: async (id: number) => {
    return await request.delete({ url: '/ai/video/delete-my?id=' + id })
  },

  // ========== 视频生成管理 ==========

  // 查询视频分页
  getVideoPage: async (params: any) => {
    return await request.get({ url: '/ai/video/page', params })
  },

  // 查询视频详情；不存在（例如已删除）时返回 null
  getVideo: async (id: number): Promise<VideoVO | null> => {
    return await request.get({ url: '/ai/video/get?id=' + id })
  },

  // 更新视频：是否公开
  updateVideo: async (data: { id: number; publicStatus: boolean }) => {
    return await request.put({ url: '/ai/video/update', data })
  },

  // 删除视频
  deleteVideo: async (id: number) => {
    return await request.delete({ url: '/ai/video/delete?id=' + id })
  }
}
