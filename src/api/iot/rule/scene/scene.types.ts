/**
 * 场景规则触发器配置
 */
export interface IotRuleSceneTriggerConfig {
  /**
   * 触发类型
   * - 1: 设备触发
   * - 2: 定时触发
   */
  type: number
  /** 产品标识 */
  productKey?: string
  /** 设备名称数组 */
  deviceNames?: string[]
  /** 触发条件数组。条件之间是"或"的关系 */
  conditions?: IotRuleSceneTriggerCondition[]
  /** CRON 表达式。当 type = 2 时必填 */
  cronExpression?: string
}

/**
 * 触发条件
 */
export interface IotRuleSceneTriggerCondition {
  /**
   * 消息类型
   * - property: 属性上报
   * - event: 事件上报
   */
  type: string
  /** 消息标识符 */
  identifier: string
  /** 参数数组。参数之间是"或"的关系 */
  parameters: IotRuleSceneTriggerConditionParameter[]
}

/**
 * 触发条件参数
 */
export interface IotRuleSceneTriggerConditionParameter {
  /** 标识符（属性、事件、服务） */
  identifier: string
  /**
   * 操作符
   */
  operator: string
  /**
   * 比较值
   * 如果有多个值，则使用 "," 分隔，类似 "1,2,3"
   */
  value: string
}

/**
 * 执行器配置
 */
export interface IotRuleSceneActionConfig {
  /**
   * 执行类型
   * - 1: 设备控制
   * - 2: 数据桥接
   */
  type: number
  /** 设备控制配置。当 type = 1 时必填 */
  deviceControl?: IotRuleSceneActionDeviceControl
  /** 数据桥接编号。当 type = 2 时必填 */
  dataBridgeId?: number
}

/**
 * 执行设备控制
 */
export interface IotRuleSceneActionDeviceControl {
  /** 产品标识 */
  productKey: string
  /** 设备名称数组 */
  deviceNames: string[]
  /**
   * 消息类型
   * - property: 属性
   * - service: 服务
   */
  type: string
  /**
   * 消息标识符
   * - property_set: 属性设置
   * - service_invoke: 服务调用
   */
  identifier: string
  /** 具体数据 */
  data: Record<string, any>
}

/**
 * 场景规则创建/更新请求
 */
export interface IotRuleSceneSaveReqVO {
  /** 场景规则编号 */
  id?: number
  /** 场景规则名称 */
  name: string
  /** 场景规则状态（0=禁用 1=启用） */
  status: number
  /** 触发器配置 */
  triggerConfig: IotRuleSceneTriggerConfig
  /** 执行动作配置数组 */
  actionConfigs: IotRuleSceneActionConfig[]
  /** 备注 */
  remark?: string
}

/**
 * 场景规则响应
 */
export interface IotRuleSceneRespVO {
  /** 场景规则编号 */
  id: number
  /** 场景规则名称 */
  name: string
  /** 场景规则状态（0=禁用 1=启用） */
  status: number
  /** 触发器配置 */
  triggerConfig: IotRuleSceneTriggerConfig
  /** 执行动作配置数组 */
  actionConfigs: IotRuleSceneActionConfig[]
  /** 备注 */
  remark?: string
  /** 创建时间 */
  createTime: Date
}

/**
 * 场景规则分页项
 */
export interface IotRuleScenePageItemRespVO extends IotRuleSceneRespVO {
  /** 触发次数 */
  triggerCount: number
  /** 最后触发时间 */
  lastTriggerTime?: Date
}

/**
 * 场景规则分页请求
 */
export interface IotRuleScenePageReqVO {
  /** 场景规则名称 */
  name?: string
  /** 场景规则状态（0=禁用 1=启用） */
  status?: number
  /** 创建时间 */
  createTime?: [Date, Date]
  /** 页码 */
  pageNo?: number
  /** 每页条数 */
  pageSize?: number
}

/**
 * 场景规则类型枚举
 */
export enum IotRuleSceneTriggerTypeEnum {
  /** 设备触发 */
  DEVICE = 1,
  /** 定时触发 */
  TIMER = 2
}

/**
 * 场景规则动作类型枚举
 */
export enum IotRuleSceneActionTypeEnum {
  /** 设备控制 */
  DEVICE_CONTROL = 1,
  /** 数据桥接 */
  DATA_BRIDGE = 2
}

/**
 * 设备消息类型枚举
 */
export enum IotDeviceMessageTypeEnum {
  /** 属性 */
  PROPERTY = 'property',
  /** 事件 */
  EVENT = 'event',
  /** 服务 */
  SERVICE = 'service'
}

/**
 * 设备消息标识符枚举
 */
export enum IotDeviceMessageIdentifierEnum {
  /** 属性上报 */
  PROPERTY_REPORT = 'property_report',
  /** 属性设置 */
  PROPERTY_SET = 'property_set',
  /** 事件上报 */
  EVENT_REPORT = 'event_report',
  /** 服务调用 */
  SERVICE_INVOKE = 'service_invoke'
}

/**
 * 触发条件参数操作符枚举
 */
export enum IotRuleSceneTriggerConditionParameterOperatorEnum {
  /** 等于 */
  EQ = 'eq',
  /** 大于 */
  GT = 'gt',
  /** 大于等于 */
  GTE = 'gte',
  /** 小于 */
  LT = 'lt',
  /** 小于等于 */
  LTE = 'lte',
  /** 范围 */
  BETWEEN = 'between',
  /** 在列表中 */
  IN = 'in'
}
