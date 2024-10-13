import request from '@/config/axios'

// IoT 产品物模型 VO
export interface ThinkModelFunctionVO {
  id: number // 物模型功能编号
  identifier: string // 功能标识
  name: string // 功能名称
  description: string // 功能描述
  productId: number // 产品编号
  productKey: string // 产品标识
  type: number // 功能类型
  property: string // 属性
  event: string // 事件
  service: string // 服务
}

// IoT 产品物模型 API
export const ThinkModelFunctionApi = {
  // 查询产品物模型分页
  getThinkModelFunctionPage: async (params: any) => {
    return await request.get({ url: `/iot/think-model-function/page`, params })
  },
  // 获得产品物模型
  getThinkModelFunctionListByProductId: async (params: any) => {
    return await request.get({
      url: `/iot/think-model-function/list-by-product-id`,
      params
    })
  },

  // 查询产品物模型详情
  getThinkModelFunction: async (id: number) => {
    return await request.get({ url: `/iot/think-model-function/get?id=` + id })
  },

  // 新增产品物模型
  createThinkModelFunction: async (data: ThinkModelFunctionVO) => {
    return await request.post({ url: `/iot/think-model-function/create`, data })
  },

  // 修改产品物模型
  updateThinkModelFunction: async (data: ThinkModelFunctionVO) => {
    return await request.put({ url: `/iot/think-model-function/update`, data })
  },

  // 删除产品物模型
  deleteThinkModelFunction: async (id: number) => {
    return await request.delete({ url: `/iot/think-model-function/delete?id=` + id })
  },

  // 导出产品物模型 Excel
  exportThinkModelFunction: async (params) => {
    return await request.download({ url: `/iot/think-model-function/export-excel`, params })
  }
}
