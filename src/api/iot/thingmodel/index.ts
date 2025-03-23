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
 * IoT 模拟设备
 */
// TODO @super：和 ThingModelSimulatorData 会不会好点
export interface SimulatorData extends ThingModelData {
  simulateValue?: string | number // 用于存储模拟值 TODO @super：字段使用 value 会不会好点
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

// IoT 产品物模型 API
export const ThingModelApi = {
  // 查询产品物模型分页
  getThingModelPage: async (params: any) => {
    return await request.get({ url: `/iot/thing-model/page`, params })
  },

  // 获得产品物模型列表
  getThingModelList: async (params: any) => {
    return await request.get({ url: `/iot/thing-model/list`, params })
  },

  // 获得产品物模型
  getThingModelListByProductId: async (params: any) => {
    return await request.get({
      url: `/iot/thing-model/list-by-product-id`,
      params
    })
  },

  // 查询产品物模型详情
  getThingModel: async (id: number) => {
    return await request.get({ url: `/iot/thing-model/get?id=` + id })
  },

  // 新增产品物模型
  createThingModel: async (data: ThingModelData) => {
    return await request.post({ url: `/iot/thing-model/create`, data })
  },

  // 修改产品物模型
  updateThingModel: async (data: ThingModelData) => {
    return await request.put({ url: `/iot/thing-model/update`, data })
  },

  // 删除产品物模型
  deleteThingModel: async (id: number) => {
    return await request.delete({ url: `/iot/thing-model/delete?id=` + id })
  }
}
