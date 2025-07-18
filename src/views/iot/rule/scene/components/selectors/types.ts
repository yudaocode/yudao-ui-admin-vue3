// IoT物模型TSL数据类型定义

// TODO @puhui999：看看这些里面，是不是一些已经有了哈？可以复用下~

/** 物模型TSL响应数据结构 */
export interface IotThingModelTSLRespVO {
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
  dataSpecs?: ThingModelDataSpecs
  dataSpecsList?: ThingModelDataSpecs[]
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
  dataSpecs?: ThingModelDataSpecs
  dataSpecsList?: ThingModelDataSpecs[]
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
  dataSpecsList?: ThingModelDataSpecs[]
}

/** 结构体型数据规范 */
export interface ThingModelStructDataSpecs {
  dataType: 'struct'
  identifier: string
  name: string
  accessMode: string
  required?: boolean
  childDataType: string
  dataSpecs?: ThingModelDataSpecs
  dataSpecsList?: ThingModelDataSpecs[]
}

/** 数据规范联合类型 */
export type ThingModelDataSpecs =
  | ThingModelNumericDataSpec
  | ThingModelBoolOrEnumDataSpecs
  | ThingModelDateOrTextDataSpecs
  | ThingModelArrayDataSpecs
  | ThingModelStructDataSpecs

/** 属性选择器内部使用的统一数据结构 */
export interface PropertySelectorItem {
  identifier: string
  name: string
  description?: string
  dataType: string
  type: number // IoTThingModelTypeEnum
  accessMode?: string
  required?: boolean
  unit?: string
  range?: string
  eventType?: string
  callType?: string
  inputParams?: ThingModelParam[]
  outputParams?: ThingModelParam[]
  property?: ThingModelProperty
  event?: ThingModelEvent
  service?: ThingModelService
}

/** 数据类型枚举 */
export enum DataTypeEnum {
  INT = 'int',
  FLOAT = 'float',
  DOUBLE = 'double',
  ENUM = 'enum',
  BOOL = 'bool',
  TEXT = 'text',
  DATE = 'date',
  STRUCT = 'struct',
  ARRAY = 'array'
}

/** 访问模式枚举 */
export enum AccessModeEnum {
  READ = 'r',
  READ_write = 'rw'
}

/** 事件类型枚举 */
export enum EventTypeEnum {
  INFO = 'info',
  ALERT = 'alert',
  ERROR = 'error'
}

/** 调用类型枚举 */
export enum CallTypeEnum {
  ASYNC = 'async',
  SYNC = 'sync'
}

/** 参数方向枚举 */
export enum ParamDirectionEnum {
  INPUT = 'input',
  OUTPUT = 'output'
}
