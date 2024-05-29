import request from '@/config/axios'

// AI API 密钥 VO
export interface ImageDetailVO {
  id: number // 编号
  prompt: string // 提示词
  status: string // 状态
  errorMessage: string // 错误信息
  type: string // 模型下分不同的类型(清晰、真实...)
  taskId: number // dr 任务id
  picUrl: string // 任务地址
  originalPicUrl: string // 绘制图片地址
  platform: string // 平台
  model: string // 模型
  style: string // 图像生成的风格
  size: string // 图片尺寸
  createTime: string // 创建时间
  updateTime: string // 更新事件
}

export interface ImagePageReqVO {
  pageNo: number // 分页编号
  pageSize: number // 分页大小
}

export interface ImageDallReqVO {
  prompt: string // 提示词
  model: string // 模型
  style: string // 图像生成的风格
  size: string // size不能为空
}

// AI API 密钥 API
export const ImageApi = {
  // 获取 image 列表
  getImageList: async (params: ImagePageReqVO) => {
    return await request.get({ url: `/ai/image/my-page`, params })
  },
  // 获取 image 详细信息
  getImageDetail: async (id: number) => {
    return await request.get({ url: `/ai/image/get-my?id=${id}`})
  },
  // dall2、dall3 调用
  dall: async (data: ImageDallReqVO)=> {
    return await request.post({ url: `/ai/image/dall`, data })
  },
  // 删除
  deleteImage: async (id: number)=> {
    return await request.delete({ url: `/ai/image/delete-my?id=${id}`})
  },
}
