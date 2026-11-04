import type { FormValueType } from './form'

export type ComponentName =
  | 'Radio'
  | 'RadioButton'
  | 'Checkbox'
  | 'CheckboxButton'
  | 'Input'
  | 'Autocomplete'
  | 'InputNumber'
  | 'Select'
  | 'Cascader'
  | 'Switch'
  | 'Slider'
  | 'TimePicker'
  | 'DatePicker'
  | 'Rate'
  | 'ColorPicker'
  | 'Transfer'
  | 'Divider'
  | 'TimeSelect'
  | 'SelectV2'
  | 'TreeSelect'
  | 'InputPassword'
  | 'Editor'
  | 'UploadImg'
  | 'UploadImgs'
  | 'UploadFile'
  | 'Upload'
  | 'IAgree'
  | 'RadioGroup'
  | 'CheckboxGroup'
  | 'JsonEditor'
  | 'IconPicker'

export type ColProps = {
  span?: number
  xs?: number
  sm?: number
  md?: number
  lg?: number
  xl?: number
  tag?: string
}

export type ComponentOptions = {
  label?: string
  value?: FormValueType
  disabled?: boolean
  key?: string | number
  children?: ComponentOptions[]
  options?: ComponentOptions[]
} & Recordable

export type ComponentOptionsAlias = {
  labelField?: string
  valueField?: string
}

// 组件事件：键为事件名（change、visible-change / visibleChange、update:fileList 等），按 Vue 规则转为 onXxx 监听；
// 与 componentProps 中已有的同名 onXxx（含别名）合并，均会触发
export type ComponentEvents = Record<string, ((...args: any[]) => any) | undefined>

// 组件插槽：值为函数时是渲染函数，插槽名 camelCase 转 kebab-case，参数为组件插槽原参数；
// default 在 Select / Radio / Checkbox 类中参数为 options 并替换自动渲染的选项，在 SelectV2 中参数为 (item, 原插槽参数)；
// optionDefault(option) / optionGroupDefault(option) 只用于 Select 的选项 / 分组。
// 值为 true 等非函数真值时是模板插槽标记，对应 Form 的模板插槽 #字段-插槽名，插槽名不变。
// 类型保持原 Recordable 的宽松约束，兼容已有写法；是否为函数由运行时判断
export type ComponentSlots = Recordable

export type ComponentProps = {
  optionsAlias?: ComponentOptionsAlias
  options?: ComponentOptions[]
  optionsSlot?: boolean
  on?: ComponentEvents
  slots?: ComponentSlots
} & Recordable
