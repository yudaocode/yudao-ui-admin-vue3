import request from '@/config/axios'

/**
 * IoT 产品物模型
 */
export interface ThingModelData {
  id?: number // 物模型功能编号
  identifier?: string // 功能标识
  name?: string // 功能名称
  description?: string // 功能描述
  productId?: number // 产品编号
  productKey?: string // 产品标识
  type: ProductFunctionTypeEnum // 功能类型
  property: ThingModelProperty // 属性
  event?: ThingModelEvent // 事件
  service?: ThingModelService // 服务
}

/**
 * ThingModelProperty 类型
 */
export interface ThingModelProperty {
  [key: string]: any
}

/**
 * ThingModelEvent 类型
 */
export interface ThingModelEvent {
  [key: string]: any
}

/**
 * ThingModelService 类型
 */
export interface ThingModelService {
  [key: string]: any
}

// IOT 产品功能（物模型）类型枚举类
export enum ProductFunctionTypeEnum {
  PROPERTY = 1, // 属性
  SERVICE = 2, // 服务
  EVENT = 3 // 事件
}

// IOT 产品功能（物模型）访问模式枚举类
export enum ProductFunctionAccessModeEnum {
  READ_WRITE = 'rw', // 读写
  READ_ONLY = 'r' // 只读
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
  createThinkModelFunction: async (data: ThingModelData) => {
    return await request.post({ url: `/iot/think-model-function/create`, data })
  },

  // 修改产品物模型
  updateThinkModelFunction: async (data: ThingModelData) => {
    return await request.put({ url: `/iot/think-model-function/update`, data })
  },

  // 删除产品物模型
  deleteThinkModelFunction: async (id: number) => {
    return await request.delete({ url: `/iot/think-model-function/delete?id=` + id })
  }
}
