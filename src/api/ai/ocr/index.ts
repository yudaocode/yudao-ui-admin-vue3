import request from '@/config/axios'

// AI 文字识别 VO
export interface OcrVO {
  id: number // 编号
  userId: number // 用户编号
  userNickname?: string // 用户昵称（仅管理端）
  modelId: number // 模型编号
  modelName?: string // 模型名字
  platform: string // 平台
  model?: string // 模型标识
  fileName: string // 图片文件名
  imageUrl: string // 图片地址
  status: number // 识别状态，参见 AiOcrStatusEnum
  originalText?: string | null // 识别出的原文
  editedText?: string | null // 修订后的文本：null 表示未修订，空字符串表示已清空
  errorMessage?: string // 失败原因
  duration?: number // 识别耗时，单位：毫秒
  createTime: Date // 创建时间
  updateTime: Date // 更新时间
}

// AI 文字识别模型 VO：不包含密钥
export interface OcrModelVO {
  id: number // 编号
  name: string // 模型名字
  platform: string // 平台
  model?: string // 模型标识
  description?: string // 模型简介
}

const RECOGNIZE_TIMEOUT = 2 * 60 * 1000 // 同步识别，超时时间放宽到 2 分钟

// AI 文字识别 API
export const OcrApi = {
  // 获得可用的文字识别模型列表
  getOcrModelList: async (): Promise<OcrModelVO[]> => {
    return await request.get({ url: '/ai/ocr/model-list' })
  },

  // 识别图片中的文字：图片先上传到文件服务，同步返回识别记录，成功、失败都会新增一条记录
  recognizeOcr: async (data: { modelId: number; fileUrl: string }): Promise<OcrVO> => {
    return await request.post({ url: '/ai/ocr/recognize', data, timeout: RECOGNIZE_TIMEOUT })
  },

  // 获得【我的】识别记录分页
  getOcrMyPage: async (params: PageParam) => {
    return await request.get({ url: '/ai/ocr/my-page', params })
  },

  // 获得【我的】识别记录
  getOcrMy: async (id: number): Promise<OcrVO> => {
    return await request.get({ url: '/ai/ocr/get-my?id=' + id })
  },

  // 保存【我的】识别修订：空字符串表示清空内容
  updateOcrMy: async (data: { id: number; editedText: string }): Promise<OcrVO> => {
    return await request.put({ url: '/ai/ocr/update-my', data })
  },

  // 删除【我的】识别记录
  deleteOcrMy: async (id: number) => {
    return await request.delete({ url: '/ai/ocr/delete-my?id=' + id })
  },

  // ================ OCR 管理 ================

  // 获得识别记录分页
  getOcrPage: async (params: any) => {
    return await request.get({ url: '/ai/ocr/page', params })
  },

  // 获得识别记录：不存在时返回空
  getOcr: async (id: number): Promise<OcrVO | null> => {
    return await request.get({ url: '/ai/ocr/get?id=' + id })
  },

  // 删除识别记录
  deleteOcr: async (id: number) => {
    return await request.delete({ url: '/ai/ocr/delete?id=' + id })
  }
}
