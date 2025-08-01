/**
 * IoT 场景联动接口定义
 */

// TODO @puhui999：枚举挪到 views/iot/utils/constants.ts 里
// 枚举定义
const IotRuleSceneTriggerTypeEnum = {
  DEVICE_STATE_UPDATE: 1, // 设备上下线变更
  DEVICE_PROPERTY_POST: 2, // 物模型属性上报
  DEVICE_EVENT_POST: 3, // 设备事件上报
  DEVICE_SERVICE_INVOKE: 4, // 设备服务调用
  TIMER: 100 // 定时触发
} as const

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

// TODO @puhui999：这个貌似可以不要？
const IotDeviceMessageIdentifierEnum = {
  PROPERTY_SET: 'set', // 属性设置
  SERVICE_INVOKE: '${identifier}' // 服务调用
} as const

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

// TODO @puhui999：下面 IotAlertConfigReceiveTypeEnum、DeviceStateEnum 没用到，貌似可以删除下？
const IotAlertConfigReceiveTypeEnum = {
  SMS: 1, // 短信
  MAIL: 2, // 邮箱
  NOTIFY: 3 // 通知
} as const

// 设备状态枚举
const DeviceStateEnum = {
  INACTIVE: 0, // 未激活
  ONLINE: 1, // 在线
  OFFLINE: 2 // 离线
} as const

// TODO @puhui999：这个全局已经有啦
// 通用状态枚举
const CommonStatusEnum = {
  ENABLE: 0, // 开启
  DISABLE: 1 // 关闭
} as const

// 基础接口
// TODO @puhui999：这个貌似可以不要？
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

// 表单数据接口
interface RuleSceneFormData {
  id?: number
  name: string
  description?: string
  status: number
  trigger: TriggerFormData
  actions: ActionFormData[]
}

interface TriggerFormData {
  type: number
  productId?: number
  deviceId?: number
  identifier?: string
  operator?: string
  value?: string
  cronExpression?: string
  // 新的条件结构
  mainCondition?: ConditionFormData // 主条件（必须满足）
  conditionGroup?: ConditionGroupContainerFormData // 条件组容器（可选，与主条件为且关系）
}

interface ActionFormData {
  type: number
  productId?: number
  deviceId?: number
  params?: Record<string, any>
  alertConfigId?: number
}

// 条件组容器（包含多个子条件组，子条件组间为或关系）
interface ConditionGroupContainerFormData {
  subGroups: SubConditionGroupFormData[] // 子条件组数组，子条件组间为或关系
}

// 子条件组（内部条件为且关系）
interface SubConditionGroupFormData {
  conditions: ConditionFormData[] // 条件数组，条件间为且关系
}

// 保留原有接口用于兼容性
interface ConditionGroupFormData {
  conditions: ConditionFormData[]
  // 注意：条件组内部的条件固定为"且"关系，条件组之间固定为"或"关系
  // logicOperator 字段保留用于兼容性，但在UI中固定为 'AND'
  logicOperator: 'AND' | 'OR'
}

interface ConditionFormData {
  type: number // 条件类型：1-设备状态，2-设备属性，3-当前时间
  productId?: number // 产品ID（设备状态和设备属性时必填）
  deviceId?: number // 设备ID（设备状态和设备属性时必填）
  identifier?: string // 标识符（设备属性时必填）
  operator: string // 操作符
  param: string // 参数值
  timeValue?: string // 时间值（当前时间条件时使用）
  timeValue2?: string // 第二个时间值（时间范围条件时使用）
}

// 主接口
interface IotRuleScene extends TenantBaseDO {
  id?: number // 场景编号（新增时为空）
  name: string // 场景名称（必填）
  description?: string // 场景描述（可选）
  status: number // 场景状态：0-开启，1-关闭
  triggers: TriggerConfig[] // 触发器数组（必填，至少一个）
  actions: ActionConfig[] // 执行器数组（必填，至少一个）
}

// 工具类型 - 从枚举中提取类型
export type TriggerType =
  (typeof IotRuleSceneTriggerTypeEnum)[keyof typeof IotRuleSceneTriggerTypeEnum]
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
  TriggerConfig,
  TriggerCondition,
  TriggerConditionParameter,
  ActionConfig,
  ActionDeviceControl,
  RuleSceneFormData,
  TriggerFormData,
  ActionFormData,
  ConditionGroupFormData,
  ConditionGroupContainerFormData,
  SubConditionGroupFormData,
  ConditionFormData,
  IotRuleSceneTriggerTypeEnum,
  IotRuleSceneActionTypeEnum,
  IotDeviceMessageTypeEnum,
  IotDeviceMessageIdentifierEnum,
  IotRuleSceneTriggerConditionParameterOperatorEnum,
  IotRuleSceneTriggerConditionTypeEnum,
  IotRuleSceneTriggerTimeOperatorEnum,
  IotAlertConfigReceiveTypeEnum,
  DeviceStateEnum,
  CommonStatusEnum,
  ValidationRule,
  FormValidationRules
}
