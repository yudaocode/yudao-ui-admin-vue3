import type { FormItemRule } from 'element-plus'
import type { Trigger, TriggerCondition } from '@/api/iot/rule/scene'
import {
  IotRuleSceneTriggerTypeEnum,
  IotRuleSceneTriggerConditionTypeEnum,
  IotRuleSceneTriggerTimeOperatorEnum,
  isDeviceTrigger
} from '@/views/iot/utils/constants'

const requiredRule = (message: string): FormItemRule => ({
  required: true,
  message,
  trigger: ['change', 'blur']
})

const isEmpty = (val: unknown) => val === undefined || val === null || val === ''

/** 主条件表单项校验规则（与 MainConditionInnerConfig 展示字段对齐） */
export function buildMainConditionRules(triggerType: number): Record<string, FormItemRule[]> {
  const base: Record<string, FormItemRule[]> = {
    productId: [requiredRule('请选择产品')],
    deviceId: [requiredRule('请选择设备')]
  }

  if (triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE) {
    return {
      ...base,
      operator: [requiredRule('请选择操作符')],
      value: [requiredRule('请选择设备状态')]
    }
  }

  if (
    triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST ||
    triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST ||
    triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE
  ) {
    const rules: Record<string, FormItemRule[]> = {
      ...base,
      identifier: [requiredRule('请选择监控项')]
    }

    const isEventOrService =
      triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST ||
      triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE

    if (!isEventOrService) {
      rules.operator = [requiredRule('请选择操作符')]
      rules.value = [requiredRule('请填写比较值')]
    }
    return rules
  }

  return {}
}

/**
 * 校验单个触发器（与主条件 UI 一致，供 RuleSceneForm 兜底）
 * @returns 错误信息，通过则返回 null
 */
export function validateTriggerItem(trigger: Trigger, index: number): string | null {
  if (!trigger.type) {
    return `触发器 ${index + 1}: 触发器类型不能为空`
  }

  if (isDeviceTrigger(trigger.type)) {
    if (!trigger.productId) {
      return `触发器 ${index + 1}: 产品不能为空`
    }
    if (!trigger.deviceId) {
      return `触发器 ${index + 1}: 设备不能为空`
    }

    if (trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE) {
      if (!trigger.operator) {
        return `触发器 ${index + 1}: 操作符不能为空`
      }
      if (isEmpty(trigger.value)) {
        return `触发器 ${index + 1}: 设备状态不能为空`
      }
      return null
    }

    if (!trigger.identifier) {
      return `触发器 ${index + 1}: 物模型标识符不能为空`
    }

    const isEventOrService =
      trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST ||
      trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE
    if (!isEventOrService) {
      if (!trigger.operator) {
        return `触发器 ${index + 1}: 操作符不能为空`
      }
      if (isEmpty(trigger.value)) {
        return `触发器 ${index + 1}: 参数值不能为空`
      }
    }
    return null
  }

  if (trigger.type === IotRuleSceneTriggerTypeEnum.TIMER) {
    if (!trigger.cronExpression) {
      return `触发器 ${index + 1}: CRON表达式不能为空`
    }
  }

  const groupError = validateTriggerConditionGroups(trigger.conditionGroups, index)
  if (groupError) {
    return groupError
  }

  return null
}

/** 子条件表单项校验规则（与 ConditionConfig 展示字段对齐） */
export function buildSubConditionRules(
  conditionType?: number,
  getOperator?: () => string
): Record<string, FormItemRule[]> {
  const rules: Record<string, FormItemRule[]> = {
    type: [requiredRule('请选择条件类型')]
  }

  if (!conditionType) {
    return rules
  }

  if (
    conditionType === IotRuleSceneTriggerConditionTypeEnum.DEVICE_STATUS ||
    conditionType === IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY
  ) {
    rules.productId = [requiredRule('请选择产品')]
    rules.deviceId = [requiredRule('请选择设备')]
  }

  if (conditionType === IotRuleSceneTriggerConditionTypeEnum.DEVICE_STATUS) {
    rules.operator = [requiredRule('请选择操作符')]
    rules.param = [requiredRule('请选择设备状态')]
  }

  if (conditionType === IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY) {
    rules.identifier = [requiredRule('请选择监控项')]
    rules.operator = [requiredRule('请选择操作符')]
    rules.param = [requiredRule('请填写比较值')]
  }

  if (conditionType === IotRuleSceneTriggerConditionTypeEnum.CURRENT_TIME) {
    rules.operator = [requiredRule('请选择时间条件')]
    rules.param = [createCurrentTimeParamRule(getOperator ?? (() => ''))]
  }

  return rules
}

/** 当前时间条件的 param 校验 */
function createCurrentTimeParamRule(getOperator: () => string): FormItemRule {
  return {
    validator: (_rule, value, callback) => {
      const operator = getOperator()
      if (operator === IotRuleSceneTriggerTimeOperatorEnum.TODAY.value) {
        callback()
        return
      }
      if (isEmpty(value)) {
        callback(new Error('请填写时间值'))
        return
      }
      if (operator === IotRuleSceneTriggerTimeOperatorEnum.BETWEEN_TIME.value) {
        const parts = String(value).split(',')
        if (!parts[0]?.trim() || !parts[1]?.trim()) {
          callback(new Error('请填写开始和结束时间'))
          return
        }
      }
      callback()
    },
    trigger: ['change', 'blur']
  }
}

/**
 * 校验单个子条件
 * @returns 错误信息，通过则返回 null
 */
export function validateTriggerCondition(
  condition: TriggerCondition,
  path: string
): string | null {
  if (!condition.type) {
    return `${path}: 条件类型不能为空`
  }

  if (
    condition.type === IotRuleSceneTriggerConditionTypeEnum.DEVICE_STATUS ||
    condition.type === IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY
  ) {
    if (!condition.productId) {
      return `${path}: 产品不能为空`
    }
    if (!condition.deviceId) {
      return `${path}: 设备不能为空`
    }
  }

  if (condition.type === IotRuleSceneTriggerConditionTypeEnum.DEVICE_STATUS) {
    if (!condition.operator) {
      return `${path}: 操作符不能为空`
    }
    if (isEmpty(condition.param)) {
      return `${path}: 设备状态不能为空`
    }
    return null
  }

  if (condition.type === IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY) {
    if (!condition.identifier) {
      return `${path}: 监控项不能为空`
    }
    if (!condition.operator) {
      return `${path}: 操作符不能为空`
    }
    if (isEmpty(condition.param)) {
      return `${path}: 比较值不能为空`
    }
    return null
  }

  if (condition.type === IotRuleSceneTriggerConditionTypeEnum.CURRENT_TIME) {
    if (!condition.operator) {
      return `${path}: 时间条件不能为空`
    }
    if (condition.operator === IotRuleSceneTriggerTimeOperatorEnum.TODAY.value) {
      return null
    }
    if (isEmpty(condition.param)) {
      return `${path}: 时间值不能为空`
    }
    if (condition.operator === IotRuleSceneTriggerTimeOperatorEnum.BETWEEN_TIME.value) {
      const parts = String(condition.param).split(',')
      if (!parts[0]?.trim() || !parts[1]?.trim()) {
        return `${path}: 开始和结束时间不能为空`
      }
    }
    return null
  }

  return null
}

/** 校验触发器的附加条件组 */
export function validateTriggerConditionGroups(
  groups: TriggerCondition[][] | undefined,
  triggerIndex: number
): string | null {
  if (!groups?.length) {
    return null
  }

  for (let g = 0; g < groups.length; g++) {
    const group = groups[g]
    if (!group?.length) {
      return `触发器 ${triggerIndex + 1} 子条件组 ${g + 1}: 至少需要一个条件`
    }
    for (let c = 0; c < group.length; c++) {
      const error = validateTriggerCondition(
        group[c],
        `触发器 ${triggerIndex + 1} 子条件组 ${g + 1} 条件 ${c + 1}`
      )
      if (error) {
        return error
      }
    }
  }

  return null
}
