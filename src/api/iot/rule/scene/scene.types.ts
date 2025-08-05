/**
 * IoT 场景联动接口定义
 */

// ========== IoT物模型TSL数据类型定义 ==========

// TODO @puhui999：看看有些是不是在别的模块已经定义了。物模型的

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

// ========== 场景联动规则相关接口定义 ==========

// 后端 DO 接口 - 匹配后端数据结构
interface IotSceneRule {
  id?: number // 场景编号
  name: string // 场景名称
  description?: string // 场景描述
  status: number // 场景状态：0-开启，1-关闭
  triggers: Trigger[] // 触发器数组
  actions: Action[] // 执行器数组
}

// 触发器 DO 结构
interface Trigger {
  type: number // 触发类型
  productId?: number // 产品编号
  deviceId?: number // 设备编号
  identifier?: string // 物模型标识符
  operator?: string // 操作符
  value?: string // 参数值
  cronExpression?: string // CRON 表达式
  conditionGroups?: TriggerCondition[][] // 条件组（二维数组）
}

// 触发条件 DO 结构
interface TriggerCondition {
  type: number // 条件类型：1-设备状态，2-设备属性，3-当前时间
  productId?: number // 产品编号
  deviceId?: number // 设备编号
  identifier?: string // 标识符
  operator: string // 操作符
  param: string // 参数
}

// 执行器 DO 结构
interface Action {
  type: number // 执行类型
  productId?: number // 产品编号
  deviceId?: number // 设备编号
  identifier?: string // 物模型标识符（服务调用时使用）
  params?: Record<string, any> // 请求参数
  alertConfigId?: number // 告警配置编号
}

// 表单验证规则类型
interface ValidationRule {
  required?: boolean
  message?: string
  trigger?: string | string[]
  type?: string
  min?: number
  max?: number
  enum?: any[]
}

interface FormValidationRules {
  [key: string]: ValidationRule[]
}

// 表单数据类型别名
export type TriggerFormData = Trigger

// TODO @puhui999：这个文件，目标最终没有哈，和别的模块一致；

export { IotSceneRule, Trigger, TriggerCondition, Action, ValidationRule, FormValidationRules }
