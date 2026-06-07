import request from '@/config/axios'

// AI 模型计费配置 VO
export interface ModelPricingVO {
  id: number
  modelId: number
  currency: string
  priceInPer1mYuan: number
  priceCachedPer1mYuan: number
  priceOutPer1mYuan: number
  priceReasoningPer1mYuan: number
  status: number
  createTime: Date
}

// AI 模型计费配置 API
export const ModelPricingApi = {
  // 查询分页
  getModelPricingPage: async (params: any) => {
    return await request.get({ url: `/ai/model-pricing/page`, params })
  },

  // 查询详情
  getModelPricing: async (id: number) => {
    return await request.get({ url: `/ai/model-pricing/get?id=` + id })
  },

  // 新增
  createModelPricing: async (data: ModelPricingVO) => {
    return await request.post({ url: `/ai/model-pricing/create`, data })
  },

  // 修改
  updateModelPricing: async (data: ModelPricingVO) => {
    return await request.put({ url: `/ai/model-pricing/update`, data })
  },

  // 删除
  deleteModelPricing: async (id: number) => {
    return await request.delete({ url: `/ai/model-pricing/delete?id=` + id })
  }
}
