/**
 * IoT 场景联动接口定义
 */

// 枚举定义已迁移到 constants.ts，这里不再重复导出

const IotRuleSceneActionTypeEnum = {
  DEVICE_PROPERTY_SET: 1, // 设备属性设置,
  DEVICE_SERVICE_INVOKE: 2, // 设备服务调用
  ALERT_TRIGGER: 100, // 告警触发
  ALERT_RECOVER: 101 // 告警恢复
} as const

const IotDeviceMessageTypeEnum = {
  PROPERTY: 'property', // 属性
  SERVICE: 'service', // 服务
  EVENT: 'event' // 事件
} as const

// 已删除不需要的 IotDeviceMessageIdentifierEnum

const IotRuleSceneTriggerConditionParameterOperatorEnum = {
  EQUALS: { name: '等于', value: '=' }, // 等于
  NOT_EQUALS: { name: '不等于', value: '!=' }, // 不等于
  GREATER_THAN: { name: '大于', value: '>' }, // 大于
  GREATER_THAN_OR_EQUALS: { name: '大于等于', value: '>=' }, // 大于等于
  LESS_THAN: { name: '小于', value: '<' }, // 小于
  LESS_THAN_OR_EQUALS: { name: '小于等于', value: '<=' }, // 小于等于
  IN: { name: '在...之中', value: 'in' }, // 在...之中
  NOT_IN: { name: '不在...之中', value: 'not in' }, // 不在...之中
  BETWEEN: { name: '在...之间', value: 'between' }, // 在...之间
  NOT_BETWEEN: { name: '不在...之间', value: 'not between' }, // 不在...之间
  LIKE: { name: '字符串匹配', value: 'like' }, // 字符串匹配
  NOT_NULL: { name: '非空', value: 'not null' } // 非空
} as const

// 条件类型枚举
const IotRuleSceneTriggerConditionTypeEnum = {
  DEVICE_STATUS: 1, // 设备状态
  DEVICE_PROPERTY: 2, // 设备属性
  CURRENT_TIME: 3 // 当前时间
} as const

// 时间运算符枚举
const IotRuleSceneTriggerTimeOperatorEnum = {
  BEFORE_TIME: { name: '在时间之前', value: 'before_time' }, // 在时间之前
  AFTER_TIME: { name: '在时间之后', value: 'after_time' }, // 在时间之后
  BETWEEN_TIME: { name: '在时间之间', value: 'between_time' }, // 在时间之间
  AT_TIME: { name: '在指定时间', value: 'at_time' }, // 在指定时间
  BEFORE_TODAY: { name: '在今日之前', value: 'before_today' }, // 在今日之前
  AFTER_TODAY: { name: '在今日之后', value: 'after_today' }, // 在今日之后
  TODAY: { name: '在今日之间', value: 'today' } // 在今日之间
} as const

// 已删除未使用的枚举：IotAlertConfigReceiveTypeEnum、DeviceStateEnum
// CommonStatusEnum 已在全局定义，这里不再重复定义

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

// 工具类型 - 从枚举中提取类型
// TriggerType 现在从 constants.ts 中的枚举提取
export type ActionType =
  (typeof IotRuleSceneActionTypeEnum)[keyof typeof IotRuleSceneActionTypeEnum]
export type MessageType = (typeof IotDeviceMessageTypeEnum)[keyof typeof IotDeviceMessageTypeEnum]
export type OperatorType =
  (typeof IotRuleSceneTriggerConditionParameterOperatorEnum)[keyof typeof IotRuleSceneTriggerConditionParameterOperatorEnum]['value']

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
  IotRuleSceneActionTypeEnum,
  IotDeviceMessageTypeEnum,
  IotRuleSceneTriggerConditionParameterOperatorEnum,
  IotRuleSceneTriggerConditionTypeEnum,
  IotRuleSceneTriggerTimeOperatorEnum,
  ValidationRule,
  FormValidationRules
}
