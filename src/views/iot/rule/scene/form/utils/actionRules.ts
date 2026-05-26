import type { FormItemRule } from 'element-plus'
import type { Action } from '@/api/iot/rule/scene'
import { IotRuleSceneActionTypeEnum } from '@/views/iot/utils/constants'

const requiredRule = (message: string): FormItemRule => ({
  required: true,
  message,
  trigger: ['change', 'blur']
})

/** 判断执行器参数是否为空 */
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

/** 设备控制执行器表单项校验规则 */
export function buildDeviceControlRules(actionType: number): Record<string, FormItemRule[]> {
  const rules: Record<string, FormItemRule[]> = {
    productId: [requiredRule('请选择产品')],
    deviceId: [requiredRule('请选择设备')],
    params: [createParamsRule()]
  }

  if (actionType === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE) {
    rules.identifier = [requiredRule('请选择服务')]
  }

  return rules
}

/** 告警配置表单项校验规则 */
export function buildAlertConfigRules(): Record<string, FormItemRule[]> {
  return {
    alertConfigId: [requiredRule('请选择告警配置')]
  }
}

function createParamsRule(): FormItemRule {
  return {
    validator: (_rule, value, callback) => {
      if (isActionParamsEmpty(value)) {
        callback(new Error('请填写参数配置'))
        return
      }
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
 * 校验单个执行器（兜底，与 UI 一致）
 * @returns 错误信息，通过则返回 null
 */
export function validateActionItem(action: Action, index: number): string | null {
  const prefix = `执行器 ${index + 1}`

  if (!action.type) {
    return `${prefix}: 执行器类型不能为空`
  }

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

  if (action.type === IotRuleSceneActionTypeEnum.ALERT_RECOVER) {
    if (!action.alertConfigId) {
      return `${prefix}: 告警配置不能为空`
    }
  }

  return null
}
