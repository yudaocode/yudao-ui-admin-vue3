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
  dataType: string // 数据类型，与 dataSpecs 的 dataType 保持一致
  type: number // 功能类型
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

// IOT 产品物模型类型枚举类
export const ThingModelType = {
  PROPERTY: 1, // 属性
  SERVICE: 2, // 服务
  EVENT: 3 // 事件
} as const

// IOT 产品物模型访问模式枚举类
export const ThingModelAccessMode = {
  READ_WRITE: {
    label: '读写',
    value: 'rw'
  },
  READ_ONLY: {
    label: '只读',
    value: 'r'
  }
} as const

// IOT 产品物模型服务调用方式枚举
export const ThingModelServiceCallType = {
  ASYNC: {
    label: '异步调用',
    value: 'async'
  },
  SYNC: {
    label: '同步调用',
    value: 'sync'
  }
} as const

// IOT 产品物模型事件类型枚举
export const ThingModelServiceEventType = {
  INFO: {
    label: '信息',
    value: 'info'
  },
  ALERT: {
    label: '告警',
    value: 'alert'
  },
  ERROR: {
    label: '故障',
    value: 'error'
  }
} as const

// IOT 产品物模型参数是输入参数还是输出参数
export const ThingModelParamDirection = {
  INPUT: 'input', // 输入参数
  OUTPUT: 'output' // 输出参数
} as const

// IoT 产品物模型 API
export const ThingModelApi = {
  // 查询产品物模型分页
  getThingModelPage: async (params: any) => {
    return await request.get({ url: `/iot/product-thing-model/page`, params })
  },

  // 获得产品物模型
  getThingModelListByProductId: async (params: any) => {
    return await request.get({
      url: `/iot/product-thing-model/list-by-product-id`,
      params
    })
  },

  // 查询产品物模型详情
  getThingModel: async (id: number) => {
    return await request.get({ url: `/iot/product-thing-model/get?id=` + id })
  },

  // 新增产品物模型
  createThingModel: async (data: ThingModelData) => {
    return await request.post({ url: `/iot/product-thing-model/create`, data })
  },

  // 修改产品物模型
  updateThingModel: async (data: ThingModelData) => {
    return await request.put({ url: `/iot/product-thing-model/update`, data })
  },

  // 删除产品物模型
  deleteThingModel: async (id: number) => {
    return await request.delete({ url: `/iot/product-thing-model/delete?id=` + id })
  }
}
