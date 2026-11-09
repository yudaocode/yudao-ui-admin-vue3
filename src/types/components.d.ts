import type { StyleValue, VNodeChild } from 'vue'
import type { ComponentSize } from 'element-plus'
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

// Select / Radio / Checkbox 类的选项字段别名（兼容上游 componentProps.props），值为选项中的字段名：
// label / value 仅在未配置 optionsAlias 对应字段时生效；disabled 未配置时使用选项自身 disabled；
// key 只用于 Select 选项 / 分组及 Radio / Checkbox 选项的 VNode key，缺少时以 value 回退
export type ComponentOptionsProps = {
  label?: string
  value?: string
  disabled?: string
  key?: string
}

// 组件事件监听：返回值不限（可为 Promise / thenable，由 Form 合并后统一返回）
export type ComponentEventListener = (...args: any[]) => any

// 组件事件：键为事件名（change、visible-change / visibleChange、update:fileList 等），按 Vue 规则转为 onXxx 监听；
// 值为函数或函数数组（与运行时一致，数组中的监听依次执行），与 componentProps 中已有的同名 onXxx（含别名）合并，均会触发
export type ComponentEvents = Record<
  string,
  ComponentEventListener | ComponentEventListener[] | undefined
>

// 组件插槽：值为函数时是渲染函数，插槽名 camelCase 转 kebab-case，参数为组件插槽原参数；
// default 在 Select / Radio / Checkbox 类中参数为 options 并替换自动渲染的选项，在 SelectV2 中参数为 (item, 原插槽参数)；
// optionDefault(option) / optionGroupDefault(option) 只用于 Select 的选项 / 分组。
// 值为 true 等非函数真值时是模板插槽标记，对应 Form 的模板插槽 #字段-插槽名，插槽名不变。
// 类型保持原 Recordable 的宽松约束，兼容已有写法；是否为函数由运行时判断
export type ComponentSlots = Recordable

// props 不在此收窄：它同时是 TreeSelect / Cascader / Transfer 等组件的原生属性（如 children、函数 disabled），
// 仍按 Recordable 宽松透传；Select / Radio / Checkbox 类按 ComponentOptionsProps 读取字段别名
export type ComponentProps = {
  optionsAlias?: ComponentOptionsAlias
  options?: ComponentOptions[]
  optionsSlot?: boolean
  on?: ComponentEvents
  slots?: ComponentSlots
} & Recordable

// RadioButton 选项：value 支持 string / number / boolean；其余字段（如 name、border）透传给 ElRadioButton
export type RadioButtonOption = {
  label?: string
  value?: string | number | boolean
  disabled?: boolean
} & Recordable

// RadioButton change 事件监听，参数为选中值
export type RadioButtonChangeListener = (value: string | number | boolean | undefined) => any

/**
 * RadioButton 组件属性（参考上游 deeee73bc 的 RadioButtonComponentProps）：
 * Form 渲染为 ElRadioGroup，options 渲染为 ElRadioButton（value 取选项 value，内容取 label）。
 * 字段别名逐字段解析：optionsAlias（labelField / valueField）优先，未配置时使用上游的 props 别名
 * （label / value / disabled，渲染参考上游 6f1a94809，类型参考 deeee73bc，此处为可选；key 为本地兼容扩展），最后为默认字段；
 * 未列出的属性同样透传给 ElRadioGroup，与 ComponentProps 一样保持宽松。
 * 不并入 FormSchema.componentProps 联合（会收窄其它组件 slots 的上下文推断），需要提示时显式标注，
 * 如 componentProps: { ... } satisfies RadioButtonComponentProps，或先赋给 RadioButtonComponentProps 类型的变量
 */
export interface RadioButtonComponentProps extends ComponentProps {
  // ElRadioGroup 属性
  size?: ComponentSize
  disabled?: boolean
  // 按钮激活时的文字颜色、背景与边框颜色
  textColor?: string
  fill?: string
  // 值变化时是否触发表单校验
  validateEvent?: boolean
  // 无障碍标签
  label?: string
  name?: string
  id?: string
  options?: RadioButtonOption[]
  optionsAlias?: ComponentOptionsAlias
  // 数据源的字段别名，值为选项中的字段名
  props?: ComponentOptionsProps
  on?: {
    change?: RadioButtonChangeListener | RadioButtonChangeListener[]
  } & ComponentEvents
  slots?: {
    // 替换自动渲染的选项，参数为当前 options；为 true 时对应模板插槽 #字段-default（需不传 options）
    default?: ((options: RadioButtonOption[]) => VNodeChild) | true
  } & ComponentSlots
  // 与 Vue style 绑定一致：对象、字符串或数组
  style?: StyleValue
}

// 其余组件属性命名类型定义在 Form 组件内（与运行时枚举 ComponentNameEnum 同一文件），此处仅类型转出；
// 运行时枚举请从 @/components/Form 导入
export type {
  InputComponentProps,
  AutocompleteComponentProps,
  InputNumberComponentProps,
  SelectComponentProps,
  SelectV2ComponentProps,
  CascaderComponentProps,
  SwitchComponentProps,
  RateComponentProps,
  ColorPickerComponentProps,
  TransferComponentProps,
  InputPasswordComponentProps,
  CheckboxButtonComponentProps
} from '@/components/Form/src/componentProps'
