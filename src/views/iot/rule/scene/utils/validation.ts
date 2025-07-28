/**
 * IoT 场景联动表单验证工具函数
 */
import { FormValidationRules, TriggerConfig, ActionConfig } from '@/api/iot/rule/scene/scene.types'
import {
  IotRuleSceneTriggerTypeEnum,
  IotRuleSceneActionTypeEnum,
  CommonStatusEnum
} from '@/api/iot/rule/scene/scene.types'

/** 基础表单验证规则 */
export const getBaseValidationRules = (): FormValidationRules => ({
  name: [
    { required: true, message: '场景名称不能为空', trigger: 'blur' },
    { type: 'string', min: 1, max: 50, message: '场景名称长度应在1-50个字符之间', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '场景状态不能为空', trigger: 'change' },
    {
      type: 'enum',
      enum: [CommonStatusEnum.ENABLE, CommonStatusEnum.DISABLE],
      message: '状态值必须为启用或禁用',
      trigger: 'change'
    }
  ],
  description: [
    { type: 'string', max: 200, message: '场景描述不能超过200个字符', trigger: 'blur' }
  ],
  triggers: [
    { required: true, message: '触发器数组不能为空', trigger: 'change' },
    { type: 'array', min: 1, message: '至少需要一个触发器', trigger: 'change' }
  ],
  actions: [
    { required: true, message: '执行器数组不能为空', trigger: 'change' },
    { type: 'array', min: 1, message: '至少需要一个执行器', trigger: 'change' }
  ]
})

/** 验证CRON表达式格式 */
export function validateCronExpression(cron: string): boolean {
  if (!cron || cron.trim().length === 0) return false
  // 基础的 CRON 表达式正则验证（支持6位和7位格式）
  const cronRegex =
    /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))( (\*|([1-9][0-9]{3})|\*\/([1-9][0-9]{3})))?$/
  return cronRegex.test(cron.trim())
}

/** 验证设备名称数组 */
export function validateDeviceNames(deviceNames: string[]): boolean {
  return (
    Array.isArray(deviceNames) &&
    deviceNames.length > 0 &&
    deviceNames.every((name) => name && name.trim().length > 0)
  )
}

/** 验证比较值格式 */
export function validateCompareValue(operator: string, value: string): boolean {
  if (!value || value.trim().length === 0) return false
  const trimmedValue = value.trim()
  switch (operator) {
    case 'between':
    case 'not between':
      const betweenValues = trimmedValue.split(',')
      return (
        betweenValues.length === 2 &&
        betweenValues.every((v) => v.trim().length > 0) &&
        !isNaN(Number(betweenValues[0].trim())) &&
        !isNaN(Number(betweenValues[1].trim()))
      )
    case 'in':
    case 'not in':
      const inValues = trimmedValue.split(',')
      return inValues.length > 0 && inValues.every((v) => v.trim().length > 0)
    case '>':
    case '>=':
    case '<':
    case '<=':
      return !isNaN(Number(trimmedValue))
    case '=':
    case '!=':
    case 'like':
    case 'not null':
    default:
      return true
  }
}

/** 验证触发器配置 */
export function validateTriggerConfig(trigger: TriggerConfig): {
  valid: boolean
  message?: string
} {
  if (!trigger.type) {
    return { valid: false, message: '触发类型不能为空' }
  }
  // 定时触发验证
  if (trigger.type === IotRuleSceneTriggerTypeEnum.TIMER) {
    if (!trigger.cronExpression) {
      return { valid: false, message: 'CRON表达式不能为空' }
    }
    if (!validateCronExpression(trigger.cronExpression)) {
      return { valid: false, message: 'CRON表达式格式不正确' }
    }
    return { valid: true }
  }
  // 设备触发验证
  if (!trigger.productKey) {
    return { valid: false, message: '产品标识不能为空' }
  }
  if (!trigger.deviceNames || !validateDeviceNames(trigger.deviceNames)) {
    return { valid: false, message: '设备名称不能为空' }
  }
  // 设备状态变更无需额外条件验证
  if (trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE) {
    return { valid: true }
  }
  // 其他设备触发类型需要验证条件
  if (!trigger.conditions || trigger.conditions.length === 0) {
    return { valid: false, message: '触发条件不能为空' }
  }
  // 验证每个条件的参数
  for (const condition of trigger.conditions) {
    if (!condition.parameters || condition.parameters.length === 0) {
      return { valid: false, message: '触发条件参数不能为空' }
    }
    for (const param of condition.parameters) {
      if (!param.operator) {
        return { valid: false, message: '操作符不能为空' }
      }
      if (!validateCompareValue(param.operator, param.value)) {
        return { valid: false, message: `操作符 "${param.operator}" 对应的比较值格式不正确` }
      }
    }
  }
  return { valid: true }
}

/** 验证执行器配置 */
export function validateActionConfig(action: ActionConfig): { valid: boolean; message?: string } {
  if (!action.type) {
    return { valid: false, message: '执行类型不能为空' }
  }
  // 告警触发/恢复验证
  if (
    action.type === IotRuleSceneActionTypeEnum.ALERT_TRIGGER ||
    action.type === IotRuleSceneActionTypeEnum.ALERT_RECOVER
  ) {
    if (!action.alertConfigId) {
      return { valid: false, message: '告警配置ID不能为空' }
    }
    return { valid: true }
  }
  // 设备控制验证
  if (
    action.type === IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET ||
    action.type === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE
  ) {
    if (!action.deviceControl) {
      return { valid: false, message: '设备控制配置不能为空' }
    }
    const { deviceControl } = action
    if (!deviceControl.productKey) {
      return { valid: false, message: '产品标识不能为空' }
    }
    if (!deviceControl.deviceNames || !validateDeviceNames(deviceControl.deviceNames)) {
      return { valid: false, message: '设备名称不能为空' }
    }
    if (!deviceControl.type) {
      return { valid: false, message: '消息类型不能为空' }
    }
    if (!deviceControl.identifier) {
      return { valid: false, message: '消息标识符不能为空' }
    }
    if (!deviceControl.params || Object.keys(deviceControl.params).length === 0) {
      return { valid: false, message: '参数不能为空' }
    }
    return { valid: true }
  }

  return { valid: false, message: '未知的执行类型' }
}
