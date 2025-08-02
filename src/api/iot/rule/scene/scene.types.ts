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

// 基础接口（如果项目中有全局的 BaseDO，可以使用全局的）
interface TenantBaseDO {
  createTime?: Date // 创建时间
  updateTime?: Date // 更新时间
  creator?: string // 创建者
  updater?: string // 更新者
  deleted?: boolean // 是否删除
  tenantId?: number // 租户编号
}

// 触发条件参数
interface TriggerConditionParameter {
  identifier0?: string // 标识符（事件、服务）
  identifier?: string // 标识符（属性）
  operator: string // 操作符（必填）
  value: string // 比较值（必填，多值用逗号分隔）
}

// 触发条件
interface TriggerCondition {
  type: string // 消息类型
  identifier: string // 消息标识符
  parameters: TriggerConditionParameter[] // 参数数组
}

// 触发器配置
interface TriggerConfig {
  key?: string // 组件唯一标识符，用于解决索引重用问题
  type: number // 触发类型（必填）
  productKey?: string // 产品标识（设备触发时必填）
  deviceNames?: string[] // 设备名称数组（设备触发时必填）
  conditions?: TriggerCondition[] // 触发条件数组（设备触发时必填）
  cronExpression?: string // CRON表达式（定时触发时必填）
}

// 执行设备控制
interface ActionDeviceControl {
  productKey: string // 产品标识（必填）
  deviceNames: string[] // 设备名称数组（必填）
  type: string // 消息类型（必填）
  identifier: string // 消息标识符（必填）
  params: Record<string, any> // 参数对象（必填）- 统一使用 params 字段
}

// 执行器配置
interface ActionConfig {
  key?: string // 组件唯一标识符，用于解决索引重用问题
  type: number // 执行类型（必填）
  deviceControl?: ActionDeviceControl // 设备控制（设备控制时必填）
  alertConfigId?: number // 告警配置ID（告警恢复时必填）
}

// 表单数据接口 - 直接对应后端 DO 结构
interface RuleSceneFormData {
  id?: number
  name: string
  description?: string
  status: number
  triggers: TriggerFormData[] // 支持多个触发器
  actions: ActionFormData[]
}

// 触发器表单数据 - 直接对应 TriggerDO
interface TriggerFormData {
  type: number // 触发类型
  productId?: number // 产品编号
  deviceId?: number // 设备编号
  identifier?: string // 物模型标识符
  operator?: string // 操作符
  value?: string // 参数值
  cronExpression?: string // CRON 表达式
  conditionGroups?: TriggerConditionFormData[][] // 条件组（二维数组）
}

// 触发条件表单数据 - 直接对应 TriggerConditionDO
interface TriggerConditionFormData {
  type: number // 条件类型：1-设备状态，2-设备属性，3-当前时间
  productId?: number // 产品编号
  deviceId?: number // 设备编号
  identifier?: string // 标识符
  operator: string // 操作符
  param: string // 参数值
}

// 执行器表单数据 - 直接对应 ActionDO
interface ActionFormData {
  type: number // 执行类型
  productId?: number // 产品编号
  deviceId?: number // 设备编号
  params?: Record<string, any> // 请求参数
  alertConfigId?: number // 告警配置编号
}

// 主接口 - 原有的 API 接口格式（保持兼容性）
interface IotRuleScene extends TenantBaseDO {
  id?: number // 场景编号（新增时为空）
  name: string // 场景名称（必填）
  description?: string // 场景描述（可选）
  status: number // 场景状态：0-开启，1-关闭
  triggers: TriggerConfig[] // 触发器数组（必填，至少一个）
  actions: ActionConfig[] // 执行器数组（必填，至少一个）
}

// 后端 DO 接口 - 匹配后端数据结构
interface IotRuleSceneDO {
  id?: number // 场景编号
  name: string // 场景名称
  description?: string // 场景描述
  status: number // 场景状态：0-开启，1-关闭
  triggers: TriggerDO[] // 触发器数组
  actions: ActionDO[] // 执行器数组
}

// 触发器 DO 结构
interface TriggerDO {
  type: number // 触发类型
  productId?: number // 产品编号
  deviceId?: number // 设备编号
  identifier?: string // 物模型标识符
  operator?: string // 操作符
  value?: string // 参数值
  cronExpression?: string // CRON 表达式
  conditionGroups?: TriggerConditionDO[][] // 条件组（二维数组）
}

// 触发条件 DO 结构
interface TriggerConditionDO {
  type: number // 条件类型
  productId?: number // 产品编号
  deviceId?: number // 设备编号
  identifier?: string // 标识符
  operator: string // 操作符
  param: string // 参数
}

// 执行器 DO 结构
interface ActionDO {
  type: number // 执行类型
  productId?: number // 产品编号
  deviceId?: number // 设备编号
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

// TODO @puhui999：这个文件，目标最终没有哈，和别的模块一致；

export {
  IotRuleScene,
  IotRuleSceneDO,
  TriggerDO,
  TriggerConditionDO,
  ActionDO,
  TriggerConfig,
  TriggerCondition,
  TriggerConditionParameter,
  ActionConfig,
  ActionDeviceControl,
  RuleSceneFormData,
  TriggerFormData,
  TriggerConditionFormData,
  ActionFormData,
  ValidationRule,
  FormValidationRules
}
