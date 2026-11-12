import request from '@/config/axios'
import { AiPptExportFormatEnum } from '@/views/ai/utils/constants'

// AI PPT 幻灯片的图片版本 VO
export interface PptSlideImageVO {
  url: string // 图片地址：库里保存的地址，切换版本时提交它
  prompt: string // 实际发给绘图模型的完整提示词
  createTime: Date // 生成时间
}

// AI PPT 幻灯片（一页） VO
export interface PptSlideVO {
  index: number // 页码，从 1 开始
  theme?: string // 本页主题
  title?: string // 本页标题
  points?: string[] // 本页要点
  imagePrompt: string // 首次生图的提示词
  imageUrl?: string // 当前图地址：库里保存的地址，与历史版本的 url 对应；为空表示还没有图
  status?: number // 本页最近一次生成的状态，为空表示待生成，参见 AiPptStatusEnum
  errorMessage?: string // 本页最近一次失败的原因
  images?: PptSlideImageVO[] // 历史版本
}

// AI PPT VO
export interface PptVO {
  id: number // 编号
  userId: number // 用户编号
  userNickname?: string // 用户昵称，仅管理端返回
  title: string // 标题
  source: number // 素材来源，参见 AiPptSourceEnum
  content?: string // 大纲或材料文本
  fileUrl?: string // 上传材料文件地址
  prompt?: string // 风格与设计要求
  mode: number // 格式，参见 AiPptModeEnum
  language: string // 语言：zh-CN、en
  pageCount: number // 请求页数
  chatModelId: number // 对话模型编号
  imageModelId: number // 绘图模型编号
  slides?: PptSlideVO[] // 分镜与配图
  coverUrl?: string // 封面图地址
  slideCount: number // 分镜页数
  finishCount: number // 已有配图页数
  status: number // 状态，参见 AiPptStatusEnum
  errorMessage?: string // 失败原因
  finishTime?: Date // 完成时间
  createTime: Date // 创建时间
}

// AI PPT 生成 Request VO
export interface PptGenerateReqVO {
  source: number // 素材来源：1 粘贴大纲、2 上传材料
  content?: string // 大纲（粘贴大纲）
  fileUrl?: string // 材料文件地址（上传材料），先上传到文件服务
  prompt?: string // 风格与设计要求
  mode: number // 格式
  language: string // 语言，参见 AiPptLanguageEnum
  pageCount: number // 页数
  imageModelId?: number // 绘图模型编号
}

const EXPORT_TIMEOUT = 5 * 60 * 1000 // 导出需要逐页下载图片，超时时间放宽到 5 分钟

// AI PPT API
export const PptApi = {
  // ========== 创作 ==========

  // 生成 PPT：上传材料时只提交文件地址，由后端按地址读取
  generatePpt: async (data: PptGenerateReqVO): Promise<number> => {
    return await request.post({ url: '/ai/ppt/generate', data })
  },

  // 继续生成【我的】PPT
  resumePptMy: async (id: number) => {
    return await request.post({ url: '/ai/ppt/resume-my?id=' + id })
  },

  // 重绘【我的】PPT 的一页
  redrawSlideMy: async (data: { id: number; slideIndex: number; prompt: string }) => {
    return await request.post({ url: '/ai/ppt/redraw-slide-my', data })
  },

  // 切换【我的】PPT 一页的当前图
  updateSlideImageMy: async (data: { id: number; slideIndex: number; imageUrl: string }) => {
    return await request.put({ url: '/ai/ppt/update-slide-image-my', data })
  },

  // ========== 我的 PPT ==========

  // 获得【我的】PPT 分页
  getPptMyPage: async (params: any) => {
    return await request.get({ url: '/ai/ppt/my-page', params })
  },

  // 获得【我的】PPT
  getPptMy: async (id: number): Promise<PptVO> => {
    return await request.get({ url: '/ai/ppt/get-my?id=' + id })
  },

  // 导出【我的】PPT
  exportPptMy: async (id: number, format: AiPptExportFormatEnum) => {
    return await request.download({
      url: '/ai/ppt/export-my',
      params: { id, format },
      timeout: EXPORT_TIMEOUT
    })
  },

  // 删除【我的】PPT
  deletePptMy: async (id: number) => {
    return await request.delete({ url: '/ai/ppt/delete-my?id=' + id })
  },

  // ========== PPT 管理 ==========

  // 查询 PPT 分页
  getPptPage: async (params: any) => {
    return await request.get({ url: '/ai/ppt/page', params })
  },

  // 查询 PPT 详情
  getPpt: async (id: number): Promise<PptVO> => {
    return await request.get({ url: '/ai/ppt/get?id=' + id })
  },

  // 导出 PPT
  exportPpt: async (id: number, format: AiPptExportFormatEnum) => {
    return await request.download({
      url: '/ai/ppt/export',
      params: { id, format },
      timeout: EXPORT_TIMEOUT
    })
  },

  // 删除 PPT
  deletePpt: async (id: number) => {
    return await request.delete({ url: '/ai/ppt/delete?id=' + id })
  }
}
