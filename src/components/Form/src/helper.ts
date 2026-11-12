import type { Slots } from 'vue'
import { camelize, toHandlerKey } from 'vue'
import { clone, get, has, toPath } from 'lodash-es'
import { getSlot } from '@/utils/tsxHelper'
import { humpToDash } from '@/utils'
import { isFunction } from '@/utils/is'
import { PlaceholderModel } from './types'
import { FormSchema } from '@/types/form'
import { ColProps } from '@/types/components'

// 与 lodash set 的防护一致：路径中包含这些键时不按嵌套路径处理，避免修改对象原型
const UNSAFE_PATH_KEYS = ['__proto__', 'constructor', 'prototype']

// 与 lodash-es _isKey.js 的 reIsDeepProp 一致：含 . 或完整 [...] 才视为路径（如 x[、a[b 仍为普通键）
const reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/

/**
 * field 是否按嵌套路径（a.b、a[0].b）处理；与 lodash 一致，存在同名字面量键时仍按普通字段处理。
 * 含 __proto__/constructor/prototype 的路径按普通字段（字面量键）处理，与原一级键实现相同
 */
const isPathField = (model: Recordable, field: string): boolean => {
  return (
    !Reflect.has(model, field) &&
    reIsDeepProp.test(field) &&
    !toPath(field).some((key) => UNSAFE_PATH_KEYS.includes(key))
  )
}

/** 按 field 判断值是否存在（已存在的 0/false/''/null/undefined 均视为存在） */
export const hasModelValue = (model: Recordable, field: string): boolean => {
  return isPathField(model, field) ? has(model, field) : Reflect.has(model, field)
}

/** 按 field 读取值，支持嵌套路径 */
export const getModelValue = (model: Recordable, field: string): any => {
  return isPathField(model, field) ? get(model, field) : model[field]
}

/**
 * 嵌套路径写入/删除时，沿途对象逐层浅拷贝，避免修改外部传入（如 setValues）的嵌套对象
 */
const updatePath = (
  model: Recordable,
  keys: string[],
  update: (target: Recordable, key: string) => void
) => {
  const build = (source: any, index: number): any => {
    const key = keys[index]
    let target: any
    if (source !== null && typeof source === 'object') {
      target = clone(source)
    } else {
      // 与 lodash set 一致：数字下标创建数组，其余创建对象
      target = /^(?:0|[1-9]\d*)$/.test(key) ? [] : {}
    }
    if (index === keys.length - 1) {
      update(target, key)
    } else {
      target[key] = build(source?.[key], index + 1)
    }
    return target
  }
  model[keys[0]] = build(model[keys[0]], 1)
}

/** 按 field 写入值，支持嵌套路径 */
export const setModelValue = (model: Recordable, field: string, value: any) => {
  const keys = toPath(field)
  if (!isPathField(model, field) || keys.length === 0) {
    model[field] = value
    return
  }
  // 只解析出一个键（如 [bracket]、[0]）时直接写该键，与 get/has 的读取位置一致
  if (keys.length === 1) {
    model[keys[0]] = value
    return
  }
  updatePath(model, keys, (target, key) => {
    target[key] = value
  })
}

/** 按 field 删除值，支持嵌套路径 */
export const unsetModelValue = (model: Recordable, field: string) => {
  const keys = toPath(field)
  if (!isPathField(model, field) || keys.length === 0) {
    delete model[field]
    return
  }
  // 只解析出一个键（如 [bracket]、[0]）时直接删除该键，与 get/has 的读取位置一致
  if (keys.length === 1) {
    delete model[keys[0]]
    return
  }
  if (!has(model, field)) return
  updatePath(model, keys, (target, key) => {
    delete target[key]
  })
}

/**
 *
 * @param schema 对应组件数据
 * @returns 返回提示信息对象
 * @description 用于自动设置placeholder
 */
export const setTextPlaceholder = (schema: FormSchema): PlaceholderModel => {
  const { t } = useI18n()
  const textMap = ['Input', 'Autocomplete', 'InputNumber', 'InputPassword']
  const selectMap = ['Select', 'SelectV2', 'TimePicker', 'DatePicker', 'TimeSelect', 'TimeSelect']
  if (textMap.includes(schema?.component as string)) {
    return {
      placeholder: t('common.inputText') + schema.label
    }
  }
  if (selectMap.includes(schema?.component as string)) {
    // 一些范围选择器
    const twoTextMap = ['datetimerange', 'daterange', 'monthrange', 'datetimerange', 'daterange']
    if (
      twoTextMap.includes(
        (schema?.componentProps?.type || schema?.componentProps?.isRange) as string
      )
    ) {
      return {
        startPlaceholder: t('common.startTimeText'),
        endPlaceholder: t('common.endTimeText'),
        rangeSeparator: '-'
      }
    } else {
      return {
        placeholder: t('common.selectText') + schema.label
      }
    }
  }
  return {}
}

/**
 *
 * @param col 内置栅格
 * @returns 返回栅格属性
 * @description 合并传入进来的栅格属性
 */
export const setGridProp = (col: ColProps = {}): ColProps => {
  const colProps: ColProps = {
    // 如果有span，代表用户优先级更高，所以不需要默认栅格
    ...(col.span
      ? {}
      : {
          xs: 24,
          sm: 12,
          md: 12,
          lg: 12,
          xl: 12
        }),
    ...col
  }
  return colProps
}

// 与 Vue isOn 一致：on 后紧跟非小写字母才是监听属性
const isListenerKey = (key: string) => /^on[^a-z]/.test(key)

// 事件名（change、visible-change、visibleChange、update:file-list）统一为 Vue 监听属性名（onChange、onVisibleChange、onUpdate:fileList）
const toListenerKey = (event: string) => toHandlerKey(camelize(event))

const toListenerList = (value: unknown): Function[] => {
  return (Array.isArray(value) ? value : [value]).filter(isFunction)
}

// 原生 Promise 与 thenable（@/utils/is 的 isPromise 要求 [object Object]，识别不了原生 Promise，这里单独判断）
const isThenable = (value: unknown): value is PromiseLike<unknown> => {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  )
}

type ListenerOutcome = PromiseSettledResult<unknown>

// 一个错误原样返回，多个错误用 AggregateError 保留全部原因
const toListenerError = (errors: unknown[]) => {
  return errors.length === 1
    ? errors[0]
    : new AggregateError(errors, `Form 组件事件的 ${errors.length} 个监听执行失败`)
}

/**
 * 多个监听合成一个函数（不用数组：ElUpload 的 onChange 等是 Function 类型的 prop，不接受数组）。
 * 每个监听都会执行，某个监听同步抛错不影响后续监听；
 * 全部同步时返回最后一个监听的返回值，有错误时抛出（单个原样，多个为 AggregateError）；
 * 有异步返回值时立即观察全部异步结果并返回一个 Promise：全部成功时为最后一个监听的结果，
 * 有错误时（含同步错误）一次性拒绝（单个原样，多个为 AggregateError），不产生额外的未处理拒绝
 */
const mergeListeners = (listeners: Function[]): Function => {
  if (listeners.length === 1) return listeners[0]
  return (...args: any[]) => {
    const outcomes: Array<ListenerOutcome | Promise<ListenerOutcome>> = []
    let hasAsync = false
    for (const listener of listeners) {
      try {
        const result = listener(...args)
        if (isThenable(result)) {
          hasAsync = true
          // allSettled 立即订阅该结果，reject 由下面统一返回，不会成为未处理拒绝
          outcomes.push(Promise.allSettled([result]).then(([outcome]) => outcome))
        } else {
          outcomes.push({ status: 'fulfilled', value: result })
        }
      } catch (error) {
        outcomes.push({ status: 'rejected', reason: error })
      }
    }
    const settle = (settled: ListenerOutcome[]) => {
      const errors = settled
        .filter((outcome): outcome is PromiseRejectedResult => outcome.status === 'rejected')
        .map((outcome) => outcome.reason)
      if (errors.length) throw toListenerError(errors)
      const last = settled[settled.length - 1] as PromiseFulfilledResult<unknown>
      return last.value
    }
    if (!hasAsync) return settle(outcomes as ListenerOutcome[])
    return Promise.all(outcomes).then(settle)
  }
}

/**
 * componentProps.on（参考上游 4d04734e1）：键为事件名，转为 onXxx 监听。
 * 与 componentProps 中已有的同名监听（函数或函数数组，含 kebab 写法的别名）以及 on 中规范到同一事件的多个键合并，均会触发
 */
const mergeOnEvents = (componentProps: Recordable) => {
  const onEvents = componentProps.on
  delete componentProps.on
  if (!onEvents || typeof onEvents !== 'object' || Array.isArray(onEvents)) return
  const eventListeners = new Map<string, Function[]>()
  for (const event in onEvents) {
    const listeners = toListenerList(onEvents[event])
    if (!event || !listeners.length) continue
    const listenerKey = toListenerKey(event)
    eventListeners.set(listenerKey, [...(eventListeners.get(listenerKey) || []), ...listeners])
  }
  if (!eventListeners.size) return
  // 收集 componentProps 中已有的同名监听：精确键在前，别名按出现顺序在后；别名合并后删除，避免重复触发
  const existingListeners = new Map<string, Function[]>()
  for (const key of Object.keys(componentProps)) {
    if (!isListenerKey(key)) continue
    const listenerKey = toListenerKey(key.slice(2))
    if (!eventListeners.has(listenerKey)) continue
    const listeners = toListenerList(componentProps[key])
    const merged = existingListeners.get(listenerKey) || []
    existingListeners.set(
      listenerKey,
      key === listenerKey ? [...listeners, ...merged] : [...merged, ...listeners]
    )
    if (key !== listenerKey) delete componentProps[key]
  }
  eventListeners.forEach((listeners, listenerKey) => {
    componentProps[listenerKey] = mergeListeners([
      ...(existingListeners.get(listenerKey) || []),
      ...listeners
    ])
  })
}

/**
 *
 * @param item 传入的组件属性
 * @returns 默认添加 clearable 属性，并把 componentProps.on 合并为 onXxx 监听
 */
export const setComponentProps = (item: FormSchema): Recordable => {
  // JsonEditor、Divider 不支持 clearable，追加后会落到 DOM 属性上
  const notNeedClearable = ['ColorPicker', 'JsonEditor', 'Divider']
  const componentProps: Recordable = notNeedClearable.includes(item.component as string)
    ? { ...item.componentProps }
    : {
        clearable: true,
        ...item.componentProps
      }
  // 需要删除额外的属性
  delete componentProps?.slots
  mergeOnEvents(componentProps)
  return componentProps
}

// Select 选项 / 分组的渲染函数，由 useRenderSelect 使用，不作为组件插槽
const selectOptionSlotKeys = ['optionDefault', 'optionGroupDefault']

/**
 *
 * @param slots 插槽
 * @param slotsProps 插槽属性
 * @param field 字段名
 * @description 值为函数时作为组件插槽渲染函数（参考上游 4d04734e1、83513d519）：插槽名 camelCase 转 kebab-case，
 * 参数为组件插槽原参数；其余真值为模板插槽标记，对应模板插槽 `${field}-${key}`，插槽名不变
 */
export const setItemComponentSlots = (
  slots: Slots,
  slotsProps: Recordable = {},
  field: string
): Recordable => {
  const slotObj: Recordable = {}
  for (const key in slotsProps) {
    const slot = slotsProps[key]
    if (isFunction(slot)) {
      if (!selectOptionSlotKeys.includes(key)) {
        slotObj[humpToDash(key)] = (...args: any[]) => slot(...args)
      }
    } else if (slot) {
      // 由于组件有可能重复，需要有一个唯一的前缀
      slotObj[key] = (data: Recordable) => {
        return getSlot(slots, `${field}-${key}`, data)
      }
    }
  }
  return slotObj
}

/**
 * 组件缺省绑定值：Transfer 的绑定值是数组，缺省时使用 []；IAgree 是勾选状态，缺省时使用 false；
 * 新增的 CheckboxGroup 缺省 []、JsonEditor 缺省 {}；其他组件（含旧 Checkbox/Radio）保持 ''
 */
const getDefaultValue = (component?: string) => {
  switch (component) {
    case 'Transfer':
    case 'CheckboxGroup':
      return []
    case 'IAgree':
      return false
    case 'JsonEditor':
      return {}
    default:
      return ''
  }
}

/**
 *
 * @param schema Form表单结构化数组
 * @param formModel FormModel
 * @returns FormModel
 * @description 生成对应的formModel
 */
export const initModel = (schema: FormSchema[], formModel: Recordable) => {
  const model: Recordable = { ...formModel }
  schema.map((v) => {
    // remove 不渲染，并删除对应的值（field 支持 a.b 嵌套路径）；hidden 只隐藏，值照常初始化、保留
    if (v.remove) {
      unsetModelValue(model, v.field)
    } else if (v.component !== 'Divider' && (v.component || v.value !== void 0)) {
      // 无 component 的自定义插槽项（参考上游 47016a535）仅在明确提供 value 时初始化；
      // 未提供 value 的（如 Search 的 action 按钮项）不产生模型字段
      // 如果先前已经有值存在，则不进行重新赋值，而是采用现有的值
      if (!hasModelValue(model, v.field)) {
        setModelValue(model, v.field, v.value !== void 0 ? v.value : getDefaultValue(v.component))
      }
    }
  })
  return model
}

/**
 * @param slots 插槽
 * @param field 字段名
 * @returns 返回FormIiem插槽
 */
export const setFormItemSlots = (slots: Slots, field: string): Recordable => {
  const slotObj: Recordable = {}
  if (slots[`${field}-error`]) {
    slotObj['error'] = (data: Recordable) => {
      return getSlot(slots, `${field}-error`, data)
    }
  }
  if (slots[`${field}-label`]) {
    slotObj['label'] = (data: Recordable) => {
      return getSlot(slots, `${field}-label`, data)
    }
  }
  return slotObj
}
