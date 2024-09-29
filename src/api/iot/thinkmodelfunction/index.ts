import request from '@/config/axios'

// IoT 产品物模型 VO
export interface ThinkModelFunctionVO {
  id: number // 物模型功能编号
  identifier: string // 功能标识
  name: string // 功能名称
  description: string // 功能描述
  productId: number // 产品ID（关联 IotProductDO 的 id）
  productKey: string // 产品Key（关联 IotProductDO 的 productKey）
  type: number // 功能类型（1 - 属性，2 - 服务，3 - 事件）
  property: string // 属性（存储 ThingModelProperty 的 JSON 数据）
  event: string // 事件（存储 ThingModelEvent 的 JSON 数据）
  service: string // 服务（存储服务的 JSON 数据）
}

// IoT 产品物模型 API
export const ThinkModelFunctionApi = {
  // 查询IoT 产品物模型分页
  getThinkModelFunctionPage: async (params: any) => {
    return await request.get({ url: `/iot/think-model-function/page`, params })
  },
  // 获得IoT 产品物模型
  getThinkModelFunctionListByProductId: async (params: any) => {
    return await request.get({
      url: `/iot/think-model-function/list-by-product-id`,
      params
    })
  },

  // 查询IoT 产品物模型详情
  getThinkModelFunction: async (id: number) => {
    return await request.get({ url: `/iot/think-model-function/get?id=` + id })
  },

  // 新增IoT 产品物模型
  createThinkModelFunction: async (data: ThinkModelFunctionVO) => {
    return await request.post({ url: `/iot/think-model-function/create`, data })
  },

  // 修改IoT 产品物模型
  updateThinkModelFunction: async (data: ThinkModelFunctionVO) => {
    return await request.put({ url: `/iot/think-model-function/update`, data })
  },

  // 删除IoT 产品物模型
  deleteThinkModelFunction: async (id: number) => {
    return await request.delete({ url: `/iot/think-model-function/delete?id=` + id })
  },

  // 导出IoT 产品物模型 Excel
  exportThinkModelFunction: async (params) => {
    return await request.download({ url: `/iot/think-model-function/export-excel`, params })
  }
}
