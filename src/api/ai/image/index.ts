import request from '@/config/axios'

// AI API 密钥 VO
export interface ImageDetailVO {
  id: number // 编号
  prompt: string // 提示词
  status: string // 状态
  errorMessage: string // 错误信息
  type: string // 模型下分不同的类型(清晰、真实...)
  taskId: number // dr 任务id
  imageUrl: string // 任务地址
  originalPicUrl: string // 绘制图片地址
  platform: string // 平台
  model: string // 模型
}

// AI API 密钥 API
export const ApiKeyApi = {
  // 查询 API 密钥分页
  getApiKeyPage: async (params: any) => {
    return await request.get({ url: `/ai/api-key/page`, params })
  },

}
