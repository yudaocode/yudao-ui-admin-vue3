import type { Slots } from 'vue'
import { clone, get, has, toPath } from 'lodash-es'
import { getSlot } from '@/utils/tsxHelper'
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

/**
 *
 * @param item 传入的组件属性
 * @returns 默认添加 clearable 属性
 */
export const setComponentProps = (item: FormSchema): Recordable => {
  // JsonEditor 不支持 clearable，追加后会落到 DOM 属性上
  const notNeedClearable = ['ColorPicker', 'JsonEditor']
  const componentProps: Recordable = notNeedClearable.includes(item.component as string)
    ? { ...item.componentProps }
    : {
        clearable: true,
        ...item.componentProps
      }
  // 需要删除额外的属性
  delete componentProps?.slots
  return componentProps
}

/**
 *
 * @param slots 插槽
 * @param slotsProps 插槽属性
 * @param field 字段名
 */
export const setItemComponentSlots = (
  slots: Slots,
  slotsProps: Recordable = {},
  field: string
): Recordable => {
  const slotObj: Recordable = {}
  for (const key in slotsProps) {
    if (slotsProps[key]) {
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
    // 如果是hidden，就删除对应的值（field 支持 a.b 嵌套路径）
    if (v.hidden) {
      unsetModelValue(model, v.field)
    } else if (v.component && v.component !== 'Divider') {
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
