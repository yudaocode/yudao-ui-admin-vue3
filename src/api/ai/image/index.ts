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
    return await request.get({ url: `/ai/image/list`, params })
  },
  // 获取 image 详细信息
  getImageDetail: async (id: number) => {
    // return await request.get({ url: `/ai/api-key/page?`, params })
    return {
      id: 1,
      prompt: '童话里的小屋是什么样子？',
      status: 'todo',
      errorMessage: 'error 未登录',
      type: 'qinxi',
      taskId: 111,
      imageUrl: 'https://img.bigpt8.com/uploads/thumbnail/20240509/b7802797e5f709f35a451a1591d4d495.png',
      platform: 'dr',
      model: 'dr'
    } as ImageDetailVO
  },
  // dall2、dall3 调用
  dall: async (data: ImageDallReqVO)=> {
    return await request.post({ url: `/ai/image/dall`, data })
  },
  // 删除
  deleteImage: async (id: number)=> {
    return await request.delete({ url: `/ai/image/delete?id=${id}`})
  },
}
