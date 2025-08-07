import { isEmpty } from '@/utils/is'

/** IoT 依赖注入 KEY */
export const IOT_PROVIDE_KEY = {
  PRODUCT: 'IOT_PRODUCT'
}

/** IoT 产品物模型类型枚举类 */
export const IoTThingModelTypeEnum = {
  PROPERTY: 1, // 属性
  SERVICE: 2, // 服务
  EVENT: 3 // 事件
} as const

/** IoT 设备消息的方法枚举 */
export const IotDeviceMessageMethodEnum = {
  // ========== 设备状态 ==========
  STATE_UPDATE: {
    method: 'thing.state.update',
    name: '设备状态变更',
    upstream: true
  },

  // ========== 设备属性 ==========
  PROPERTY_POST: {
    method: 'thing.property.post',
    name: '属性上报',
    upstream: true
  },
  PROPERTY_SET: {
    method: 'thing.property.set',
    name: '属性设置',
    upstream: false
  },

  // ========== 设备事件 ==========
  EVENT_POST: {
    method: 'thing.event.post',
    name: '事件上报',
    upstream: true
  },

  // ========== 服务调用 ==========
  SERVICE_INVOKE: {
    method: 'thing.service.invoke',
    name: '服务调用',
    upstream: false
  },

  // ========== 设备配置 ==========
  CONFIG_PUSH: {
    method: 'thing.config.push',
    name: '配置推送',
    upstream: false
  }
}

// IoT 产品物模型类型枚举类
export const IotThingModelTypeEnum = {
  PROPERTY: 1, // 属性
  SERVICE: 2, // 服务
  EVENT: 3 // 事件
}

// IoT 产品物模型服务调用方式枚举
export const IoTThingModelServiceCallTypeEnum = {
  ASYNC: {
    label: '异步',
    value: 'async'
  },
  SYNC: {
    label: '同步',
    value: 'sync'
  }
} as const
export const getThingModelServiceCallTypeLabel = (value: string): string | undefined =>
  Object.values(IoTThingModelServiceCallTypeEnum).find((type) => type.value === value)?.label

// IoT 产品物模型事件类型枚举
export const IoTThingModelEventTypeEnum = {
  INFO: {
    label: '信息',
    value: 'info'
  },
  ALERT: {
    label: '告警',
    value: 'alert'
  },
  ERROR: {
    label: '故障',
    value: 'error'
  }
} as const
export const getEventTypeLabel = (value: string): string | undefined =>
  Object.values(IoTThingModelEventTypeEnum).find((type) => type.value === value)?.label

// IoT 产品物模型参数是输入参数还是输出参数
export const IoTThingModelParamDirectionEnum = {
  INPUT: 'input', // 输入参数
  OUTPUT: 'output' // 输出参数
} as const

// IoT 产品物模型访问模式枚举类
export const IoTThingModelAccessModeEnum = {
  READ_WRITE: {
    label: '读写',
    value: 'rw'
  },
  READ_ONLY: {
    label: '只读',
    value: 'r'
  },
  WRITE_ONLY: {
    label: '只写',
    value: 'w'
  }
} as const

/** 获取访问模式标签 */
export const getAccessModeLabel = (value: string): string => {
  const mode = Object.values(IoTThingModelAccessModeEnum).find((mode) => mode.value === value)
  return mode?.label || value
}

/** 属性值的数据类型 */
export const IoTDataSpecsDataTypeEnum = {
  INT: 'int',
  FLOAT: 'float',
  DOUBLE: 'double',
  ENUM: 'enum',
  BOOL: 'bool',
  TEXT: 'text',
  DATE: 'date',
  STRUCT: 'struct',
  ARRAY: 'array'
} as const

export const getDataTypeOptions = () => {
  return [
    { value: IoTDataSpecsDataTypeEnum.INT, label: '整数型' },
    { value: IoTDataSpecsDataTypeEnum.FLOAT, label: '单精度浮点型' },
    { value: IoTDataSpecsDataTypeEnum.DOUBLE, label: '双精度浮点型' },
    { value: IoTDataSpecsDataTypeEnum.ENUM, label: '枚举型' },
    { value: IoTDataSpecsDataTypeEnum.BOOL, label: '布尔型' },
    { value: IoTDataSpecsDataTypeEnum.TEXT, label: '文本型' },
    { value: IoTDataSpecsDataTypeEnum.DATE, label: '时间型' },
    { value: IoTDataSpecsDataTypeEnum.STRUCT, label: '结构体' },
    { value: IoTDataSpecsDataTypeEnum.ARRAY, label: '数组' }
  ]
}

/** 获得物体模型数据类型配置项名称 */
export const getDataTypeOptionsLabel = (value: string) => {
  if (isEmpty(value)) {
    return value
  }
  const dataType = getDataTypeOptions().find((option) => option.value === value)
  return dataType && `${dataType.value}(${dataType.label})`
}

// IoT OTA 任务设备范围枚举
export const IoTOtaTaskDeviceScopeEnum = {
  ALL: {
    label: '全部设备',
    value: 1
  },
  SELECT: {
    label: '指定设备',
    value: 2
  }
} as const

// IoT OTA 任务状态枚举
export const IoTOtaTaskStatusEnum = {
  IN_PROGRESS: {
    label: '进行中',
    value: 10
  },
  END: {
    label: '已结束',
    value: 20
  },
  CANCELED: {
    label: '已取消',
    value: 30
  }
} as const

// IoT OTA 升级记录状态枚举
export const IoTOtaTaskRecordStatusEnum = {
  PENDING: {
    label: '待推送',
    value: 0
  },
  PUSHED: {
    label: '已推送',
    value: 10
  },
  UPGRADING: {
    label: '升级中',
    value: 20
  },
  SUCCESS: {
    label: '升级成功',
    value: 30
  },
  FAILURE: {
    label: '升级失败',
    value: 40
  },
  CANCELED: {
    label: '升级取消',
    value: 50
  }
} as const

// ========== 场景联动规则相关常量 ==========

/** IoT 场景联动触发器类型枚举 */
export const IotRuleSceneTriggerTypeEnum = {
  DEVICE_STATE_UPDATE: 1, // 设备上下线变更
  DEVICE_PROPERTY_POST: 2, // 物模型属性上报
  DEVICE_EVENT_POST: 3, // 设备事件上报
  DEVICE_SERVICE_INVOKE: 4, // 设备服务调用
  TIMER: 100 // 定时触发
} as const

/** 触发器类型选项配置 */
export const getTriggerTypeOptions = () => [
  {
    value: IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE,
    label: '设备状态变更'
  },
  {
    value: IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST,
    label: '设备属性上报'
  },
  {
    value: IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST,
    label: '设备事件上报'
  },
  {
    value: IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE,
    label: '设备服务调用'
  },
  {
    value: IotRuleSceneTriggerTypeEnum.TIMER,
    label: '定时触发'
  }
]

/** 判断是否为设备触发器类型 */
export const isDeviceTrigger = (type: number): boolean => {
  const deviceTriggerTypes = [
    IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE,
    IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST,
    IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST,
    IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE
  ] as number[]
  return deviceTriggerTypes.includes(type)
}

// ========== 场景联动规则执行器相关常量 ==========

/** IoT 场景联动执行器类型枚举 */
export const IotRuleSceneActionTypeEnum = {
  DEVICE_PROPERTY_SET: 1, // 设备属性设置
  DEVICE_SERVICE_INVOKE: 2, // 设备服务调用
  ALERT_TRIGGER: 100, // 告警触发
  ALERT_RECOVER: 101 // 告警恢复
} as const

/** 执行器类型选项配置 */
export const getActionTypeOptions = () => [
  {
    value: IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET,
    label: '设备属性设置'
  },
  {
    value: IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE,
    label: '设备服务调用'
  },
  {
    value: IotRuleSceneActionTypeEnum.ALERT_TRIGGER,
    label: '触发告警'
  },
  {
    value: IotRuleSceneActionTypeEnum.ALERT_RECOVER,
    label: '恢复告警'
  }
]

/** 判断是否为设备执行器类型 */
export const isDeviceAction = (type: number): boolean => {
  const deviceActionTypes = [
    IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET,
    IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE
  ] as number[]
  return deviceActionTypes.includes(type)
}

/** 判断是否为告警执行器类型 */
export const isAlertAction = (type: number): boolean => {
  const alertActionTypes = [
    IotRuleSceneActionTypeEnum.ALERT_TRIGGER,
    IotRuleSceneActionTypeEnum.ALERT_RECOVER
  ] as number[]
  return alertActionTypes.includes(type)
}

/** 获取执行器类型标签 */
export const getActionTypeLabel = (type: number): string => {
  const option = getActionTypeOptions().find((opt) => opt.value === type)
  return option?.label || '未知类型'
}

/** IoT 设备消息类型枚举 */
export const IotDeviceMessageTypeEnum = {
  PROPERTY: 'property', // 属性
  SERVICE: 'service', // 服务
  EVENT: 'event' // 事件
} as const

/** IoT 场景联动触发条件参数操作符枚举 */
export const IotRuleSceneTriggerConditionParameterOperatorEnum = {
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

/** IoT 场景联动触发条件类型枚举 */
export const IotRuleSceneTriggerConditionTypeEnum = {
  DEVICE_STATUS: 1, // 设备状态
  DEVICE_PROPERTY: 2, // 设备属性
  CURRENT_TIME: 3 // 当前时间
} as const

/** IoT 场景联动触发时间操作符枚举 */
export const IotRuleSceneTriggerTimeOperatorEnum = {
  BEFORE_TIME: { name: '在时间之前', value: 'before_time' }, // 在时间之前
  AFTER_TIME: { name: '在时间之后', value: 'after_time' }, // 在时间之后
  BETWEEN_TIME: { name: '在时间之间', value: 'between_time' }, // 在时间之间
  AT_TIME: { name: '在指定时间', value: 'at_time' }, // 在指定时间
  BEFORE_TODAY: { name: '在今日之前', value: 'before_today' }, // 在今日之前
  AFTER_TODAY: { name: '在今日之后', value: 'after_today' }, // 在今日之后
  TODAY: { name: '在今日之间', value: 'today' } // 在今日之间
} as const

// ========== 辅助函数 ==========

/** 获取触发器类型标签 */
export const getTriggerTypeLabel = (type: number): string => {
  const options = getTriggerTypeOptions()
  const option = options.find((item) => item.value === type)
  return option?.label || '未知类型'
}
