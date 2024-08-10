import request from '@/config/axios'

// AI 绘图 VO
export interface ImageVO {
  id: number // 编号
  platform: string // 平台
  model: string // 模型
  prompt: string // 提示词
  width: number // 图片宽度
  height: number // 图片高度
  status: number // 状态
  publicStatus: boolean // 公开状态
  picUrl: string // 任务地址
  errorMessage: string // 错误信息
  options: any // 配置 Map<string, string>
  taskId: number // 任务编号
  buttons: ImageMidjourneyButtonsVO[] // mj 操作按钮
  createTime: Date // 创建时间
  finishTime: Date // 完成时间
}

export interface ImageDrawReqVO {
  platform: string // 平台
  prompt: string // 提示词
  model: string // 模型
  style: string // 图像生成的风格
  width: string // 图片宽度
  height: string // 图片高度
  options: object // 绘制参数，Map<String, String>
}

export interface ImageMidjourneyImagineReqVO {
  prompt: string // 提示词
  model: string // 模型 mj nijj
  base64Array: string[] // size不能为空
  width: string // 图片宽度
  height: string // 图片高度
  version: string // 版本
}

export interface ImageMidjourneyActionVO {
  id: number // 图片编号
  customId: string // MJ::JOB::upsample::1::85a4b4c1-8835-46c5-a15c-aea34fad1862 动作标识
}

export interface ImageMidjourneyButtonsVO {
  customId: string // MJ::JOB::upsample::1::85a4b4c1-8835-46c5-a15c-aea34fad1862 动作标识
  emoji: string // 图标 emoji
  label: string // Make Variations 文本
  style: number // 样式: 2（Primary）、3（Green）
}

// AI 图片 API
export const ImageApi = {
  // 获取【我的】绘图分页
  getImagePageMy: async (params: any) => {
    return await request.get({ url: `/ai/image/my-page`, params })
  },
  // 获取【我的】绘图记录
  getImageMy: async (id: number) => {
    return await request.get({ url: `/ai/image/get-my?id=${id}` })
  },
  // 获取【我的】绘图记录列表
  getImageListMyByIds: async (ids: number[]) => {
    return await request.get({ url: `/ai/image/my-list-by-ids`, params: { ids: ids.join(',') } })
  },
  // 生成图片
  drawImage: async (data: ImageDrawReqVO) => {
    return await request.post({ url: `/ai/image/draw`, data })
  },
  // 删除【我的】绘画记录
  deleteImageMy: async (id: number) => {
    return await request.delete({ url: `/ai/image/delete-my?id=${id}` })
  },

  // ================ midjourney 专属 ================

  // 【Midjourney】生成图片
  midjourneyImagine: async (data: ImageMidjourneyImagineReqVO) => {
    return await request.post({ url: `/ai/image/midjourney/imagine`, data })
  },
  // 【Midjourney】Action 操作（二次生成图片）
  midjourneyAction: async (data: ImageMidjourneyActionVO) => {
    return await request.post({ url: `/ai/image/midjourney/action`, data })
  },

  // ================ 绘图管理 ================

  // 查询绘画分页
  getImagePage: async (params: any) => {
    return await request.get({ url: `/ai/image/page`, params })
  },

  // 更新绘画发布状态
  updateImage: async (data: any) => {
    return await request.put({ url: '/ai/image/update', data })
  },

  // 删除绘画
  deleteImage: async (id: number) => {
    return await request.delete({ url: `/ai/image/delete?id=` + id })
  }
}
