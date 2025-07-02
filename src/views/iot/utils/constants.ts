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
  }
} as const

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
  SPECIFIC: {
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
  COMPLETED: {
    label: '已完成',
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
