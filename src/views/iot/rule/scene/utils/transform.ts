/**
 * IoT 场景联动数据转换工具函数
 */

import {
  IotRuleScene,
  TriggerConfig,
  ActionConfig,
  RuleSceneFormData,
  TriggerFormData,
  ActionFormData
} from '@/api/iot/rule/scene/scene.types'
import { generateUUID } from '@/utils'

/**
 * 创建默认的表单数据
 */
export function createDefaultFormData(): RuleSceneFormData {
  return {
    name: '',
    description: '',
    status: 0,
    triggers: [],
    actions: []
  }
}

/**
 * 创建默认的触发器数据
 */
export function createDefaultTriggerData(): TriggerFormData {
  return {
    type: 2, // 默认为属性上报
    productId: undefined,
    deviceId: undefined,
    identifier: undefined,
    operator: undefined,
    value: undefined,
    cronExpression: undefined,
    conditionGroups: []
  }
}

/**
 * 创建默认的执行器数据
 */
export function createDefaultActionData(): ActionFormData {
  return {
    type: 1, // 默认为属性设置
    productId: undefined,
    deviceId: undefined,
    params: {},
    alertConfigId: undefined
  }
}

/**
 * 将表单数据转换为API请求格式
 */
export function transformFormToApi(formData: RuleSceneFormData): IotRuleScene {
  // 这里需要根据实际API结构进行转换
  // 暂时返回基本结构
  return {
    id: formData.id,
    name: formData.name,
    description: formData.description,
    status: Number(formData.status),
    triggers: [], // 需要根据实际API结构转换
    actions: [] // 需要根据实际API结构转换
  } as IotRuleScene
}

/**
 * 将API响应数据转换为表单格式
 */
export function transformApiToForm(apiData: IotRuleScene): RuleSceneFormData {
  return {
    ...apiData,
    status: Number(apiData.status), // 确保状态为数字类型
    triggers:
      apiData.triggers?.map((trigger) => ({
        ...trigger,
        type: Number(trigger.type),
        // 为每个触发器添加唯一标识符，解决组件索引重用问题
        key: generateUUID()
      })) || [],
    actions:
      apiData.actions?.map((action) => ({
        ...action,
        type: Number(action.type),
        // 为每个执行器添加唯一标识符，解决组件索引重用问题
        key: generateUUID()
      })) || []
  }
}

/**
 * 创建默认的触发器配置
 */
export function createDefaultTriggerConfig(type?: number): TriggerConfig {
  const baseConfig: TriggerConfig = {
    key: generateUUID(),
    type: type || 2, // 默认为物模型属性上报
    productKey: '',
    deviceNames: [],
    conditions: []
  }

  // 定时触发的默认配置
  if (type === 100) {
    return {
      ...baseConfig,
      cronExpression: '0 0 12 * * ?', // 默认每天中午12点
      productKey: undefined,
      deviceNames: undefined,
      conditions: undefined
    }
  }

  // 设备状态变更的默认配置
  if (type === 1) {
    return {
      ...baseConfig,
      conditions: undefined // 设备状态变更不需要条件
    }
  }

  // 其他设备触发类型的默认配置
  return {
    ...baseConfig,
    conditions: [
      {
        type: 'property',
        identifier: 'set',
        parameters: [
          {
            identifier: '',
            operator: '=',
            value: ''
          }
        ]
      }
    ]
  }
}

/**
 * 创建默认的执行器配置
 */
export function createDefaultActionConfig(type?: number): ActionConfig {
  const baseConfig: ActionConfig = {
    key: generateUUID(),
    type: type || 1 // 默认为设备属性设置
  }

  // 告警相关的默认配置
  if (type === 100 || type === 101) {
    return {
      ...baseConfig,
      alertConfigId: undefined
    }
  }

  // 设备控制的默认配置
  return {
    ...baseConfig,
    deviceControl: {
      productKey: '',
      deviceNames: [],
      type: 'property',
      identifier: 'set',
      params: {}
    }
  }
}

/**
 * 深度克隆对象（用于避免引用问题）
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as unknown as T
  }

  if (typeof obj === 'object') {
    const clonedObj = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }

  return obj
}

/**
 * 清理空值和无效数据
 */
export function cleanFormData(data: IotRuleScene): IotRuleScene {
  const cleaned = deepClone(data)

  // 清理触发器数据
  cleaned.triggers =
    cleaned.triggers?.filter((trigger) => {
      // 移除类型为空的触发器
      if (!trigger.type) return false

      // 定时触发器必须有CRON表达式
      if (trigger.type === 100 && !trigger.cronExpression) return false

      // 设备触发器必须有产品和设备
      if (trigger.type !== 100 && (!trigger.productKey || !trigger.deviceNames?.length))
        return false

      return true
    }) || []

  // 清理执行器数据
  cleaned.actions =
    cleaned.actions?.filter((action) => {
      // 移除类型为空的执行器
      if (!action.type) return false

      // 告警类型必须有告警配置ID
      if ((action.type === 100 || action.type === 101) && !action.alertConfigId) return false

      // 设备控制类型必须有完整的设备控制配置
      if (
        (action.type === 1 || action.type === 2) &&
        (!action.deviceControl?.productKey ||
          !action.deviceControl?.deviceNames?.length ||
          !action.deviceControl?.identifier ||
          !action.deviceControl?.params ||
          Object.keys(action.deviceControl.params).length === 0)
      ) {
        return false
      }

      return true
    }) || []

  return cleaned
}

/**
 * 格式化CRON表达式显示
 */
export function formatCronExpression(cron: string): string {
  if (!cron) return ''

  // 简单的CRON表达式解析和格式化
  const parts = cron.trim().split(' ')
  if (parts.length < 5) return cron

  const [second, minute, hour] = parts

  // 构建可读的描述
  let description = ''

  if (second === '0' && minute === '0') {
    if (hour === '*') {
      description = '每小时'
    } else if (hour.includes('/')) {
      const interval = hour.split('/')[1]
      description = `每${interval}小时`
    } else {
      description = `每天${hour}点`
    }
  } else if (second === '0') {
    if (minute === '*') {
      description = '每分钟'
    } else if (minute.includes('/')) {
      const interval = minute.split('/')[1]
      description = `每${interval}分钟`
    } else {
      description = `每小时第${minute}分钟`
    }
  } else {
    if (second === '*') {
      description = '每秒'
    } else if (second.includes('/')) {
      const interval = second.split('/')[1]
      description = `每${interval}秒`
    }
  }

  return description || cron
}

/**
 * 验证并修复数据结构
 */
export function validateAndFixData(data: IotRuleScene): IotRuleScene {
  const fixed = deepClone(data)

  // 确保必要字段存在
  if (!fixed.triggers) fixed.triggers = []
  if (!fixed.actions) fixed.actions = []

  // 修复触发器数据
  fixed.triggers = fixed.triggers.map((trigger) => {
    const fixedTrigger = { ...trigger }

    // 确保有key
    if (!fixedTrigger.key) {
      fixedTrigger.key = generateUUID()
    }
    // 定时触发器不需要产品和设备信息
    if (fixedTrigger.type === 100) {
      fixedTrigger.productKey = undefined
      fixedTrigger.deviceNames = undefined
      fixedTrigger.conditions = undefined
    }

    return fixedTrigger
  })

  // 修复执行器数据
  fixed.actions = fixed.actions.map((action) => {
    const fixedAction = { ...action }

    // 确保有key
    if (!fixedAction.key) {
      fixedAction.key = generateUUID()
    }

    // 确保类型为数字
    if (typeof fixedAction.type === 'string') {
      fixedAction.type = Number(fixedAction.type)
    }

    // 修复设备控制参数字段名
    if (fixedAction.deviceControl && 'data' in fixedAction.deviceControl) {
      fixedAction.deviceControl.params = (fixedAction.deviceControl as any).data
      delete (fixedAction.deviceControl as any).data
    }

    return fixedAction
  })

  return fixed
}

/**
 * 比较两个场景联动规则是否相等（忽略key字段）
 */
export function isRuleSceneEqual(a: IotRuleScene, b: IotRuleScene): boolean {
  const cleanA = transformFormToApi(a)
  const cleanB = transformFormToApi(b)

  return JSON.stringify(cleanA) === JSON.stringify(cleanB)
}

/**
 * 获取场景联动规则的摘要信息
 */
export function getRuleSceneSummary(ruleScene: IotRuleScene): {
  triggerSummary: string[]
  actionSummary: string[]
} {
  const triggerSummary =
    ruleScene.triggers?.map((trigger) => {
      switch (trigger.type) {
        case 1:
          return `设备状态变更 (${trigger.deviceNames?.length || 0}个设备)`
        case 2:
          return `属性上报 (${trigger.deviceNames?.length || 0}个设备)`
        case 3:
          return `事件上报 (${trigger.deviceNames?.length || 0}个设备)`
        case 4:
          return `服务调用 (${trigger.deviceNames?.length || 0}个设备)`
        case 100:
          return `定时触发 (${formatCronExpression(trigger.cronExpression || '')})`
        default:
          return '未知触发类型'
      }
    }) || []

  const actionSummary =
    ruleScene.actions?.map((action) => {
      switch (action.type) {
        case 1:
          return `属性设置 (${action.deviceControl?.deviceNames?.length || 0}个设备)`
        case 2:
          return `服务调用 (${action.deviceControl?.deviceNames?.length || 0}个设备)`
        case 100:
          return '告警触发'
        case 101:
          return '告警恢复'
        default:
          return '未知执行类型'
      }
    }) || []

  return { triggerSummary, actionSummary }
}
