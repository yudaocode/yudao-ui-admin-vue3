import request from '@/config/axios'
import { isEmpty } from '@/utils/is'

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

/** dataSpecs 数值型数据结构 */
export interface DataSpecsNumberData {
  dataType: 'int' | 'float' | 'double' // 数据类型，取值为 INT、FLOAT 或 DOUBLE
  max: string // 最大值，必须与 dataType 设置一致，且为 STRING 类型
  min: string // 最小值，必须与 dataType 设置一致，且为 STRING 类型
  step: string // 步长，必须与 dataType 设置一致，且为 STRING 类型
  precise?: string // 精度，当 dataType 为 FLOAT 或 DOUBLE 时可选
  defaultValue?: string // 默认值，可选
  unit: string // 单位的符号
  unitName: string // 单位的名称
}

/** dataSpecs 枚举型数据结构 */
export interface DataSpecsEnumOrBoolData {
  dataType: 'enum' | 'bool'
  defaultValue?: string // 默认值，可选
  name: string // 枚举项的名称
  value: number | undefined // 枚举值
}

/** 物模型TSL响应数据结构 */
export interface IotThingModelTSLResp {
  productId: number
  productKey: string
  properties: ThingModelProperty[]
  events: ThingModelEvent[]
  services: ThingModelService[]
}

/** 物模型属性 */
export interface ThingModelProperty {
  identifier: string
  name: string
  accessMode: string
  required?: boolean
  dataType: string
  description?: string
  dataSpecs?: ThingModelProperty
  dataSpecsList?: ThingModelProperty[]
}

/** 物模型事件 */
export interface ThingModelEvent {
  identifier: string
  name: string
  required?: boolean
  type: string
  description?: string
  outputParams?: ThingModelParam[]
  method?: string
}

/** 物模型服务 */
export interface ThingModelService {
  identifier: string
  name: string
  required?: boolean
  callType: string
  description?: string
  inputParams?: ThingModelParam[]
  outputParams?: ThingModelParam[]
  method?: string
}

/** 物模型参数 */
export interface ThingModelParam {
  identifier: string
  name: string
  direction: string
  paraOrder?: number
  dataType: string
  dataSpecs?: ThingModelProperty
  dataSpecsList?: ThingModelProperty[]
}

/** 数值型数据规范 */
export interface ThingModelNumericDataSpec {
  dataType: 'int' | 'float' | 'double'
  max: string
  min: string
  step: string
  precise?: string
  defaultValue?: string
  unit?: string
  unitName?: string
}

/** 布尔/枚举型数据规范 */
export interface ThingModelBoolOrEnumDataSpecs {
  dataType: 'bool' | 'enum'
  name: string
  value: number
}

/** 文本/时间型数据规范 */
export interface ThingModelDateOrTextDataSpecs {
  dataType: 'text' | 'date'
  length?: number
  defaultValue?: string
}

/** 数组型数据规范 */
export interface ThingModelArrayDataSpecs {
  dataType: 'array'
  size: number
  childDataType: string
  dataSpecsList?: ThingModelProperty[]
}

/** 结构体型数据规范 */
export interface ThingModelStructDataSpecs {
  dataType: 'struct'
  identifier: string
  name: string
  accessMode: string
  required?: boolean
  childDataType: string
  dataSpecs?: ThingModelProperty
  dataSpecsList?: ThingModelProperty[]
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

  // 获得产品物模型 TSL
  getThingModelTSLByProductId: async (productId: number) => {
    return await request.get({
      url: `/iot/thing-model/get-tsl?productId=${productId}`
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

/** 公共校验规则 */
export const ThingModelFormRules = {
  name: [
    { required: true, message: '功能名称不能为空', trigger: 'blur' },
    {
      pattern: /^[\u4e00-\u9fa5a-zA-Z0-9][\u4e00-\u9fa5a-zA-Z0-9\-_/\.]{0,29}$/,
      message:
        '支持中文、大小写字母、日文、数字、短划线、下划线、斜杠和小数点，必须以中文、英文或数字开头，不超过 30 个字符',
      trigger: 'blur'
    }
  ],
  type: [{ required: true, message: '功能类型不能为空', trigger: 'blur' }],
  identifier: [
    { required: true, message: '标识符不能为空', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_]{1,50}$/,
      message: '支持大小写字母、数字和下划线，不超过 50 个字符',
      trigger: 'blur'
    },
    {
      validator: (_: any, value: string, callback: any) => {
        const reservedKeywords = ['set', 'get', 'post', 'property', 'event', 'time', 'value']
        if (reservedKeywords.includes(value)) {
          callback(
            new Error(
              'set, get, post, property, event, time, value 是系统保留字段，不能用于标识符定义'
            )
          )
        } else if (/^\d+$/.test(value)) {
          callback(new Error('标识符不能是纯数字'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  'property.dataSpecs.childDataType': [{ required: true, message: '元素类型不能为空' }],
  'property.dataSpecs.size': [
    { required: true, message: '元素个数不能为空' },
    {
      validator: (_: any, value: any, callback: any) => {
        if (isEmpty(value)) {
          callback(new Error('元素个数不能为空'))
          return
        }
        if (isNaN(Number(value))) {
          callback(new Error('元素个数必须是数字'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  'property.dataSpecs.length': [
    { required: true, message: '请输入文本字节长度', trigger: 'blur' },
    {
      validator: (_: any, value: any, callback: any) => {
        if (isEmpty(value)) {
          callback(new Error('文本长度不能为空'))
          return
        }
        if (isNaN(Number(value))) {
          callback(new Error('文本长度必须是数字'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  'property.accessMode': [{ required: true, message: '请选择读写类型', trigger: 'change' }]
}

/** 校验布尔值名称 */
export const validateBoolName = (_: any, value: string, callback: any) => {
  if (isEmpty(value)) {
    callback(new Error('布尔值名称不能为空'))
    return
  }
  // 检查开头字符
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9]/.test(value)) {
    callback(new Error('布尔值名称必须以中文、英文字母或数字开头'))
    return
  }
  // 检查整体格式
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9][a-zA-Z0-9\u4e00-\u9fa5_-]*$/.test(value)) {
    callback(new Error('布尔值名称只能包含中文、英文字母、数字、下划线和短划线'))
    return
  }
  // 检查长度（一个中文算一个字符）
  if (value.length > 20) {
    callback(new Error('布尔值名称长度不能超过 20 个字符'))
    return
  }

  callback()
}
