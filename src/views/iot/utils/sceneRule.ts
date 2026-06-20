import type { FormItemRule } from 'element-plus'
import type { Action, Trigger, TriggerCondition } from '@/api/iot/rule/scene'
import { isEmptyVal } from '@/utils/is'
import {
  IotRuleSceneActionTypeEnum,
  IotRuleSceneTriggerConditionTypeEnum,
  IotRuleSceneTriggerTimeOperatorEnum,
  IotRuleSceneTriggerTypeEnum,
  isDeviceTrigger
} from './constants'

/** 创建 Element Plus 表单必填规则，统一触发方式和错误提示。 */
const requiredRule = (message: string): FormItemRule => ({
  required: true,
  message,
  trigger: ['change', 'blur']
})

/**
 * 构建触发器主条件的表单校验规则。
 *
 * 该规则与 MainConditionInnerConfig 中实际展示的字段保持一致：
 * - 设备状态变化：需要产品、设备、操作符、设备状态；
 * - 属性上报：需要产品、设备、监控项、操作符、比较值；
 * - 事件上报、服务调用：只需要产品、设备、监控项。
 *
 * @param triggerType 触发器类型
 * @returns Element Plus 表单 rules
 */
export function buildMainConditionRules(triggerType: number): Record<string, FormItemRule[]> {
  const base: Record<string, FormItemRule[]> = {
    productId: [requiredRule('请选择产品')],
    deviceId: [requiredRule('请选择设备')]
  }

  // 设备状态变化使用固定状态枚举作为比较值。
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

    // 事件上报和服务调用只监听是否发生，不需要额外的操作符和比较值。
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
 * 校验单个触发器配置。
 *
 * 该方法用于 RuleSceneForm 提交前兜底校验，避免子组件表单没有触发 validate 时漏掉必填项。
 * 校验逻辑需要和触发器主条件 UI 保持一致，同时继续校验附加条件组。
 *
 * @param trigger 触发器配置
 * @param index 触发器在列表中的下标，用于生成可定位的错误提示
 * @returns 错误信息，通过则返回 null
 */
export function validateTriggerItem(trigger: Trigger, index: number): string | null {
  if (!trigger.type) {
    return `触发器 ${index + 1}: 触发器类型不能为空`
  }

  // 设备类触发器都有产品、设备两个基础字段。
  if (isDeviceTrigger(trigger.type)) {
    if (!trigger.productId) {
      return `触发器 ${index + 1}: 产品不能为空`
    }
    if (!trigger.deviceId) {
      return `触发器 ${index + 1}: 设备不能为空`
    }

    // 设备状态变化不依赖物模型标识符，只校验操作符和状态值。
    if (trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE) {
      if (!trigger.operator) {
        return `触发器 ${index + 1}: 操作符不能为空`
      }
      if (isEmptyVal(trigger.value)) {
        return `触发器 ${index + 1}: 设备状态不能为空`
      }
      return null
    }

    if (!trigger.identifier) {
      return `触发器 ${index + 1}: 物模型标识符不能为空`
    }

    // 属性上报需要比较条件；事件上报、服务调用只需要物模型标识符。
    const isEventOrService =
      trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST ||
      trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE
    if (!isEventOrService) {
      if (!trigger.operator) {
        return `触发器 ${index + 1}: 操作符不能为空`
      }
      if (isEmptyVal(trigger.value)) {
        return `触发器 ${index + 1}: 参数值不能为空`
      }
    }
    return null
  }

  // 定时触发器本身需要 CRON 表达式，附加条件组在下方统一校验。
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

/**
 * 构建附加子条件的表单校验规则。
 *
 * 该规则与 ConditionConfig 中不同条件类型展示的字段保持一致：
 * - 设备状态：需要产品、设备、操作符、设备状态；
 * - 设备属性：需要产品、设备、监控项、操作符、比较值；
 * - 当前时间：需要时间条件，并按时间条件动态校验时间值。
 *
 * @param conditionType 子条件类型
 * @param getOperator 获取当前时间条件操作符的方法，用于动态判断 param 是否必填
 * @returns Element Plus 表单 rules
 */
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

  // 设备状态和设备属性都需要先确定具体产品、设备。
  if (
    conditionType === IotRuleSceneTriggerConditionTypeEnum.DEVICE_STATUS ||
    conditionType === IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY
  ) {
    rules.productId = [requiredRule('请选择产品')]
    rules.deviceId = [requiredRule('请选择设备')]
  }

  // 设备状态使用设备在线状态作为比较值。
  if (conditionType === IotRuleSceneTriggerConditionTypeEnum.DEVICE_STATUS) {
    rules.operator = [requiredRule('请选择操作符')]
    rules.param = [requiredRule('请选择设备状态')]
  }

  // 设备属性需要选择物模型属性，再填写对应的比较值。
  if (conditionType === IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY) {
    rules.identifier = [requiredRule('请选择监控项')]
    rules.operator = [requiredRule('请选择操作符')]
    rules.param = [requiredRule('请填写比较值')]
  }

  // 当前时间的 param 是否必填取决于具体操作符，例如“今天”不需要额外值。
  if (conditionType === IotRuleSceneTriggerConditionTypeEnum.CURRENT_TIME) {
    rules.operator = [requiredRule('请选择时间条件')]
    rules.param = [createCurrentTimeParamRule(getOperator ?? (() => ''))]
  }

  return rules
}

/**
 * 创建当前时间条件的 param 自定义校验规则。
 *
 * 时间条件的字段展示是动态的：
 * - 今天：不需要 param；
 * - 时间区间：param 使用逗号拼接开始时间和结束时间；
 * - 其它时间条件：param 需要填写单个时间值。
 *
 * @param getOperator 获取当前时间条件操作符的方法
 * @returns Element Plus 表单项校验规则
 */
function createCurrentTimeParamRule(getOperator: () => string): FormItemRule {
  return {
    validator: (_rule, value, callback) => {
      const operator = getOperator()

      // “今天”没有附加输入项，直接通过。
      if (operator === IotRuleSceneTriggerTimeOperatorEnum.TODAY.value) {
        callback()
        return
      }

      if (isEmptyVal(value)) {
        callback(new Error('请填写时间值'))
        return
      }

      // 时间区间需要同时存在开始和结束时间。
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
 * 校验单个附加子条件。
 *
 * 该方法用于提交前兜底校验，错误提示会带上 path，方便定位到第几个触发器、
 * 第几个条件组和第几个条件。
 *
 * @param condition 子条件配置
 * @param path 错误提示前缀
 * @returns 错误信息，通过则返回 null
 */
export function validateTriggerCondition(condition: TriggerCondition, path: string): string | null {
  if (!condition.type) {
    return `${path}: 条件类型不能为空`
  }

  // 设备状态和设备属性都必须先选择产品、设备。
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

  // 设备状态只校验操作符和状态枚举值。
  if (condition.type === IotRuleSceneTriggerConditionTypeEnum.DEVICE_STATUS) {
    if (!condition.operator) {
      return `${path}: 操作符不能为空`
    }
    if (isEmptyVal(condition.param)) {
      return `${path}: 设备状态不能为空`
    }
    return null
  }

  // 设备属性需要校验物模型标识符、操作符和比较值。
  if (condition.type === IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY) {
    if (!condition.identifier) {
      return `${path}: 监控项不能为空`
    }
    if (!condition.operator) {
      return `${path}: 操作符不能为空`
    }
    if (isEmptyVal(condition.param)) {
      return `${path}: 比较值不能为空`
    }
    return null
  }

  // 当前时间按操作符动态判断 param 是否需要填写。
  if (condition.type === IotRuleSceneTriggerConditionTypeEnum.CURRENT_TIME) {
    if (!condition.operator) {
      return `${path}: 时间条件不能为空`
    }

    if (condition.operator === IotRuleSceneTriggerTimeOperatorEnum.TODAY.value) {
      return null
    }

    if (isEmptyVal(condition.param)) {
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

/**
 * 校验触发器的附加条件组。
 *
 * 条件组结构是二维数组：外层是 OR 关系的条件组，内层是 AND 关系的条件列表。
 * 这里逐组、逐条件返回第一条错误，避免一次性弹出过多提示。
 *
 * @param groups 附加条件组
 * @param triggerIndex 触发器在列表中的下标，用于生成可定位的错误提示
 * @returns 错误信息，通过则返回 null
 */
export function validateTriggerConditionGroups(
  groups: TriggerCondition[][] | undefined,
  triggerIndex: number
): string | null {
  if (!groups?.length) {
    return null
  }

  for (let g = 0; g < groups.length; g++) {
    const group = groups[g]

    // 空条件组没有实际过滤条件，提交后语义不明确，需要拦截。
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

/**
 * 判断执行器参数是否为空。
 *
 * params 当前以 JSON 字符串存储：
 * - 空字符串、空白字符串视为空；
 * - 空对象 `{}` 视为空；
 * - 非空 JSON 对象视为已配置；
 * - 非法 JSON 不在这里判空，交给 JSON 格式校验返回更准确的错误。
 *
 * @param params 执行器参数 JSON 字符串
 * @returns 是否为空
 */
export const isActionParamsEmpty = (params?: string): boolean => {
  if (!params || !String(params).trim()) {
    return true
  }
  try {
    const parsed = JSON.parse(String(params))
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return Object.keys(parsed).length === 0
    }
  } catch {
    return false
  }
  return false
}

/**
 * 构建设备控制执行器的表单校验规则。
 *
 * 属性设置和服务调用都需要产品、设备和参数配置；
 * 服务调用还需要选择具体服务标识符。
 *
 * @param actionType 执行器类型
 * @returns Element Plus 表单 rules
 */
export function buildDeviceControlRules(actionType: number): Record<string, FormItemRule[]> {
  const rules: Record<string, FormItemRule[]> = {
    productId: [requiredRule('请选择产品')],
    deviceId: [requiredRule('请选择设备')],
    params: [createParamsRule()]
  }

  // 服务调用需要额外选择物模型服务。
  if (actionType === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE) {
    rules.identifier = [requiredRule('请选择服务')]
  }

  return rules
}

/**
 * 构建告警恢复执行器的表单校验规则。
 *
 * 告警恢复需要绑定一个告警配置，后端据此定位需要恢复的告警类型。
 *
 * @returns Element Plus 表单 rules
 */
export function buildAlertConfigRules(): Record<string, FormItemRule[]> {
  return {
    alertConfigId: [requiredRule('请选择告警配置')]
  }
}

/**
 * 创建设备控制参数的自定义校验规则。
 *
 * 参数配置来自物模型属性或服务参数，提交前需要同时满足：
 * - 已经填写了参数；
 * - 参数字符串是合法 JSON。
 *
 * @returns Element Plus 表单项校验规则
 */
function createParamsRule(): FormItemRule {
  return {
    validator: (_rule, value, callback) => {
      if (isActionParamsEmpty(value)) {
        callback(new Error('请填写参数配置'))
        return
      }

      // 这里只校验 JSON 语法，具体参数结构由物模型参数配置组件负责生成。
      try {
        JSON.parse(String(value))
      } catch {
        callback(new Error('参数格式须为合法 JSON'))
        return
      }
      callback()
    },
    trigger: ['change', 'blur']
  }
}

/**
 * 校验单个执行器配置。
 *
 * 该方法用于 RuleSceneForm 提交前兜底校验，避免子组件表单没有触发 validate 时漏掉必填项。
 * 校验逻辑需要和执行器 UI 保持一致。
 *
 * @param action 执行器配置
 * @param index 执行器在列表中的下标，用于生成可定位的错误提示
 * @returns 错误信息，通过则返回 null
 */
export function validateActionItem(action: Action, index: number): string | null {
  const prefix = `执行器 ${index + 1}`

  if (!action.type) {
    return `${prefix}: 执行器类型不能为空`
  }

  // 设备属性设置和设备服务调用都需要指定设备，并填写物模型参数。
  if (
    action.type === IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET ||
    action.type === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE
  ) {
    if (!action.productId) {
      return `${prefix}: 产品不能为空`
    }
    if (!action.deviceId) {
      return `${prefix}: 设备不能为空`
    }
    if (action.type === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE && !action.identifier) {
      return `${prefix}: 服务不能为空`
    }

    if (isActionParamsEmpty(action.params)) {
      return `${prefix}: 参数配置不能为空`
    }

    try {
      JSON.parse(String(action.params))
    } catch {
      return `${prefix}: 参数格式须为合法 JSON`
    }
    return null
  }

  // 告警恢复执行器需要绑定具体告警配置。
  if (action.type === IotRuleSceneActionTypeEnum.ALERT_RECOVER) {
    if (!action.alertConfigId) {
      return `${prefix}: 告警配置不能为空`
    }
  }

  return null
}
