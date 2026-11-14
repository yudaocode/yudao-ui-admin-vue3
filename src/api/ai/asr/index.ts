import request from '@/config/axios'

// AI 语音识别 VO
export interface AsrVO {
  id: number // 编号
  userId: number // 用户编号
  userNickname?: string // 用户昵称（仅管理端）
  modelId: number // 模型编号
  modelName?: string // 模型名字
  platform: string // 平台
  model?: string // 模型标识
  fileName: string // 音频文件名
  audioUrl: string // 音频地址
  status: number // 识别状态，参见 AiAsrStatusEnum
  originalText?: string | null // 识别出的原文
  errorMessage?: string // 失败原因
  duration?: number // 识别耗时，单位：毫秒
  createTime: Date // 创建时间
  updateTime: Date // 更新时间
}

const RECOGNIZE_TIMEOUT = 2 * 60 * 1000 // 同步识别，超时时间放宽到 2 分钟

// AI 语音识别 API
export const AsrApi = {
  // 识别音频中的语音：音频先上传到文件服务，同步返回识别记录，成功、失败都会新增一条记录
  // TODO DONE @AI：能不能是 url 噢。类似别的模块，都是上传后，然后服务端 get 后操作的哈；（已改：浏览器转为 WAV 后先上传到文件服务，只提交 fileUrl，服务端下载后识别并保存记录）
  recognizeAsr: async (data: { modelId: number; fileUrl: string }): Promise<AsrVO> => {
    return await request.post({ url: '/ai/asr/recognize', data, timeout: RECOGNIZE_TIMEOUT })
  },

  // 获得【我的】识别记录分页
  getAsrMyPage: async (params: PageParam) => {
    return await request.get({ url: '/ai/asr/my-page', params })
  },

  // 获得【我的】识别记录
  getAsrMy: async (id: number): Promise<AsrVO> => {
    return await request.get({ url: '/ai/asr/get-my?id=' + id })
  },

  // 删除【我的】识别记录
  deleteAsrMy: async (id: number) => {
    return await request.delete({ url: '/ai/asr/delete-my?id=' + id })
  },

  // ================ 语音识别管理 ================

  // 获得识别记录分页
  getAsrPage: async (params: any) => {
    return await request.get({ url: '/ai/asr/page', params })
  },

  // 获得识别记录：不存在时返回空
  getAsr: async (id: number): Promise<AsrVO | null> => {
    return await request.get({ url: '/ai/asr/get?id=' + id })
  },

  // 删除识别记录
  deleteAsr: async (id: number) => {
    return await request.delete({ url: '/ai/asr/delete?id=' + id })
  }
}
