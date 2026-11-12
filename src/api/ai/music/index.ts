import request from '@/config/axios'

// AI 音乐 VO
export interface MusicVO {
  id: number // 编号
  userId: number // 用户编号
  userNickname?: string // 用户昵称
  generateMode: number // 生成模式，参见 AiMusicGenerateModeEnum
  platform: string // 平台
  modelId: number // 模型编号
  model: string // 模型标识
  apiKeyId?: number // API 密钥编号，仅管理端返回
  apiKeyName?: string // API 密钥名称，仅管理端详情返回
  title?: string // 音乐名称
  prompt?: string // 歌曲描述（灵感模式）
  lyric?: string // 歌词
  tags?: string // 音乐风格，逗号分隔
  makeInstrumental?: boolean // 是否纯音乐
  refMusicId?: number // 来源音乐编号（续写、拼接）
  extendSeconds?: number // 续写起点（秒）
  coverUrl?: string // 封面地址
  audioUrl?: string // 音频地址
  videoUrl?: string // 视频地址
  duration?: number // 时长（秒）
  status: number // 状态，参见 AiMusicStatusEnum
  progress?: number // 进度（0-100）
  errorMessage?: string // 错误信息
  publicStatus: boolean // 是否公开
  playCount?: number // 播放次数
  taskId?: string // 中转任务编号，仅管理端返回
  clipId?: string // 中转歌曲编号，仅管理端返回
  finishTime?: Date // 完成时间
  createTime: Date // 创建时间
}

// AI 音乐生成（灵感、自定义） Request VO
export interface MusicGenerateReqVO {
  generateMode: number // 生成模式：1 灵感、2 自定义
  modelId: number // 模型编号
  prompt?: string // 歌曲描述（灵感模式）
  lyric?: string // 歌词（自定义模式）
  tags?: string // 音乐风格（自定义模式）
  title?: string // 歌曲名称（自定义模式）
  makeInstrumental?: boolean // 是否纯音乐
}

// AI 音乐续写 Request VO
export interface MusicExtendReqVO {
  id: number // 来源音乐编号
  extendSeconds: number // 续写起点（秒）
  lyric?: string // 歌词
  tags?: string // 音乐风格
  title: string // 歌曲名称
}

// AI 音乐上传 Request VO
export interface MusicUploadReqVO {
  modelId: number // 模型编号
  fileUrl: string // 音频文件地址，只支持 mp3、wav
  title?: string // 歌曲名称
}

// AI 音乐歌词 Response VO
export interface MusicLyricRespVO {
  title?: string // 歌曲名称
  lyric: string // 歌词
}

// AI 音乐 API
export const MusicApi = {
  // ========== 创作 ==========

  // 生成音乐（灵感、自定义）
  generateMusic: async (data: MusicGenerateReqVO): Promise<number> => {
    return await request.post({ url: '/ai/music/generate', data })
  },

  // 续写音乐
  extendMusic: async (data: MusicExtendReqVO): Promise<number> => {
    return await request.post({ url: '/ai/music/extend', data })
  },

  // 拼接音乐
  concatMusic: async (id: number): Promise<number> => {
    return await request.post({ url: '/ai/music/concat', data: { id } })
  },

  // 上传音乐
  uploadMusic: async (data: MusicUploadReqVO): Promise<number> => {
    return await request.post({ url: '/ai/music/upload', data })
  },

  // 生成歌词
  generateLyric: async (prompt: string): Promise<MusicLyricRespVO> => {
    return await request.post({ url: '/ai/music/generate-lyric', data: { prompt } })
  },

  // ========== 我的作品、音乐广场 ==========

  // 获得【我的】音乐分页
  getMusicMyPage: async (params: any) => {
    return await request.get({ url: '/ai/music/my-page', params })
  },

  // 获得音乐广场分页
  getMusicPublicPage: async (params: any) => {
    return await request.get({ url: '/ai/music/public-page', params })
  },

  // 获得音乐详情（本人，或已公开）
  getMusicDetail: async (id: number): Promise<MusicVO> => {
    return await request.get({ url: '/ai/music/get-detail?id=' + id })
  },

  // 修改【我的】音乐：名称、封面、是否公开
  updateMyMusic: async (data: {
    id: number
    title?: string
    coverUrl?: string
    publicStatus?: boolean
  }) => {
    return await request.put({ url: '/ai/music/update-my', data })
  },

  // 删除【我的】音乐
  deleteMusicMy: async (id: number) => {
    return await request.delete({ url: '/ai/music/delete-my?id=' + id })
  },

  // 记录播放
  playMusic: async (id: number) => {
    return await request.post({ url: '/ai/music/play?id=' + id })
  },

  // ========== 音乐管理 ==========

  // 查询音乐分页
  getMusicPage: async (params: any) => {
    return await request.get({ url: `/ai/music/page`, params })
  },

  // 查询音乐详情；不存在（例如已删除）时返回 null
  getMusic: async (id: number): Promise<MusicVO | null> => {
    return await request.get({ url: `/ai/music/get?id=` + id })
  },

  // 更新音乐
  updateMusic: async (data: { id: number; publicStatus: boolean }) => {
    return await request.put({ url: '/ai/music/update', data })
  },

  // 删除音乐
  deleteMusic: async (id: number) => {
    return await request.delete({ url: `/ai/music/delete?id=` + id })
  }
}
