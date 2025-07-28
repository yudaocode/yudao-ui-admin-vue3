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
  triggers: TriggerFormData[]
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
  conditionGroups?: ConditionGroupFormData[]
}

interface ActionFormData {
  type: number
  productId?: number
  deviceId?: number
  params?: Record<string, any>
  alertConfigId?: number
}

interface ConditionGroupFormData {
  conditions: ConditionFormData[]
  // 注意：条件组内部的条件固定为"且"关系，条件组之间固定为"或"关系
  // logicOperator 字段保留用于兼容性，但在UI中固定为 'AND'
  logicOperator: 'AND' | 'OR'
}

interface ConditionFormData {
  type: number
  productId: number
  deviceId: number
  identifier: string
  operator: string
  param: string
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
  ConditionFormData,
  IotRuleSceneTriggerTypeEnum,
  IotRuleSceneActionTypeEnum,
  IotDeviceMessageTypeEnum,
  IotDeviceMessageIdentifierEnum,
  IotRuleSceneTriggerConditionParameterOperatorEnum,
  IotAlertConfigReceiveTypeEnum,
  DeviceStateEnum,
  CommonStatusEnum,
  TriggerType,
  ActionType,
  MessageType,
  OperatorType,
  ValidationRule,
  FormValidationRules
}
