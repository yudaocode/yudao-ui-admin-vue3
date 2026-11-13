import request from '@/config/axios'

// AI 语音 VO
export interface SpeechVO {
  id: number // 编号
  userId: number // 用户编号
  userNickname?: string // 用户昵称（仅管理端）
  modelId: number // 模型编号
  platform: string // 平台
  model: string // 模型标识
  inputText: string // 朗读文本
  voice: string // 音色
  format: string // 音频格式
  speed?: number // 语速，为空时为 1
  status: number // 状态，参见 AiSpeechStatusEnum
  audioUrl?: string // 音频地址
  audioSize?: number // 音频大小（字节）
  errorMessage?: string // 失败原因
  createTime: Date // 创建时间
  finishTime?: Date // 完成时间
}

// AI 语音生成 Request VO
export interface SpeechGenerateReqVO {
  modelId: number // 模型编号
  inputText: string // 朗读文本
  voice: string // 音色
  format: string // 音频格式
  speed?: number // 语速，不传时为 1
}

// AI 语音 API
export const SpeechApi = {
  // 生成语音
  generateSpeech: async (data: SpeechGenerateReqVO): Promise<number> => {
    return await request.post({ url: '/ai/speech/generate', data })
  },

  // 获得【我的】语音分页
  getSpeechMyPage: async (params: PageParam): Promise<PageResult<SpeechVO[]>> => {
    return await request.get({ url: '/ai/speech/my-page', params })
  },

  // 获得【我的】语音：生成中的会同步一次结果
  getSpeechMy: async (id: number): Promise<SpeechVO> => {
    return await request.get({ url: '/ai/speech/get-my?id=' + id })
  },

  // 删除【我的】语音
  deleteSpeechMy: async (id: number) => {
    return await request.delete({ url: '/ai/speech/delete-my?id=' + id })
  },

  // ================ 语音管理 ================

  // 获得语音分页
  getSpeechPage: async (params: any) => {
    return await request.get({ url: '/ai/speech/page', params })
  },

  // 获得语音：不存在时返回空
  getSpeech: async (id: number): Promise<SpeechVO | null> => {
    return await request.get({ url: '/ai/speech/get?id=' + id })
  },

  // 删除语音
  deleteSpeech: async (id: number) => {
    return await request.delete({ url: '/ai/speech/delete?id=' + id })
  }
}
