/**
 * IoT 场景联动接口定义
 */

// 枚举定义
const IotRuleSceneTriggerTypeEnum = {
  DEVICE: 1, // 设备触发
  TIMER: 2 // 定时触发
} as const

const IotRuleSceneActionTypeEnum = {
  DEVICE_CONTROL: 1, // 设备执行
  ALERT: 2, // 告警执行
  DATA_BRIDGE: 3 // 桥接执行
} as const

const IotDeviceMessageTypeEnum = {
  PROPERTY: 'property', // 属性
  SERVICE: 'service', // 服务
  EVENT: 'event' // 事件
} as const

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

const IotAlertConfigReceiveTypeEnum = {
  SMS: 1, // 短信
  MAIL: 2, // 邮箱
  NOTIFY: 3 // 通知
} as const

// 基础接口
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
  identifier0: string // 标识符（事件、服务）
  identifier: string // 标识符（属性）
  operator: string // 操作符
  value: string // 比较值
}

// 触发条件
interface TriggerCondition {
  type: string // 消息类型
  identifier: string // 消息标识符
  parameters: TriggerConditionParameter[] // 参数数组
}

// 触发器配置
interface TriggerConfig {
  key: any // 解决组件索引重用
  type: number // 触发类型
  productKey: string // 产品标识
  deviceNames: string[] // 设备名称数组
  conditions?: TriggerCondition[] // 触发条件数组
  cronExpression?: string // CRON 表达式
}

// 执行设备控制
interface ActionDeviceControl {
  productKey: string // 产品标识
  deviceNames: string[] // 设备名称数组
  type: string // 消息类型
  identifier: string // 消息标识符
  data: Record<string, any> // 具体数据
}

// 告警执行配置
interface ActionAlert {
  receiveType: number // 接收方式
  phoneNumbers?: string[] // 手机号列表
  emails?: string[] // 邮箱列表
  content: string // 通知内容
}

// 执行器配置
interface ActionConfig {
  key: any // 解决组件索引重用 TODO @puhui999：看看有没更好的解决方案呢。
  type: number // 执行类型
  deviceControl?: ActionDeviceControl // 设备控制
  alert?: ActionAlert // 告警执行
  dataBridgeId?: number // 数据流转目的编号
}

// 主接口
interface IotRuleScene extends TenantBaseDO {
  id: number // 场景编号
  name: string // 场景名称
  description: string // 场景描述
  status: number // 场景状态
  triggers: TriggerConfig[] // 触发器数组
  actions: ActionConfig[] // 执行器数组
}

export {
  IotRuleScene,
  TriggerConfig,
  TriggerCondition,
  TriggerConditionParameter,
  ActionConfig,
  ActionDeviceControl,
  ActionAlert,
  IotRuleSceneTriggerTypeEnum,
  IotRuleSceneActionTypeEnum,
  IotDeviceMessageTypeEnum,
  IotDeviceMessageIdentifierEnum,
  IotRuleSceneTriggerConditionParameterOperatorEnum,
  IotAlertConfigReceiveTypeEnum
}
