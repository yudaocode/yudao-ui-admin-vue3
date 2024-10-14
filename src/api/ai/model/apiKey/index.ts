import request from '@/config/axios'

// AI API 密钥 VO
export interface ApiKeyVO {
  id: number // 编号
  name: string // 名称
  apiKey: string // 密钥
  platform: string // 平台
  url: string // 自定义 API 地址
  status: number // 状态
}

// AI API 密钥 API
export const ApiKeyApi = {
  // 查询 API 密钥分页
  getApiKeyPage: async (params: any) => {
    return await request.get({ url: `/ai/api-key/page`, params })
  },

  // 获得 API 密钥列表
  getApiKeySimpleList: async () => {
    return await request.get({ url: `/ai/api-key/simple-list` })
  },

  // 查询 API 密钥详情
  getApiKey: async (id: number) => {
    return await request.get({ url: `/ai/api-key/get?id=` + id })
  },

  // 新增 API 密钥
  createApiKey: async (data: ApiKeyVO) => {
    return await request.post({ url: `/ai/api-key/create`, data })
  },

  // 修改 API 密钥
  updateApiKey: async (data: ApiKeyVO) => {
    return await request.put({ url: `/ai/api-key/update`, data })
  },

  // 删除 API 密钥
  deleteApiKey: async (id: number) => {
    return await request.delete({ url: `/ai/api-key/delete?id=` + id })
  }
}
