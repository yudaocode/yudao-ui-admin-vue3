import type { CSSProperties, StyleValue, VNodeChild } from 'vue'
import type { AxiosPromise } from 'axios'
import type {
  ComponentSize,
  FormItemProps as ElFormItemProps,
  FormProps as ElFormProps
} from 'element-plus'

/**
 * Form 组件类型的权威定义（目录组织参考上游 9eb87ad13 的 Form/src/types/index.ts）：
 * 原 @/types/components、@/types/form 中的定义原样迁入此处；外部请从 @/components/Form 以 import type 引用。
 * 本文件只依赖 vue / axios / element-plus 类型；组件属性命名类型与运行时枚举 ComponentNameEnum
 * 仍在 ../componentProps（单向依赖本文件），此处不反向转导出，避免类型循环
 */

export interface PlaceholderModel {
  placeholder?: string
  startPlaceholder?: string
  endPlaceholder?: string
  rangeSeparator?: string
}

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

export type FormSetPropsType = {
  field: string
  path: string
  value: any
}

// Recordable 用于 JsonEditor 等对象值组件
export type FormValueType =
  | string
  | number
  | string[]
  | number[]
  | boolean
  | undefined
  | null
  | Recordable

/**
 * ElFormItem 属性：在本地字段之外，补齐当前 Element Plus FormItem 的原生属性
 * （size / for / validateStatus / labelPosition 等，参考上游 207c5b3fc、283bc58d4），由 Form 原样透传；
 * prop / label 由 Form 按 field / label 设置，不在此声明；rules / style / slots 保持本地定义
 */
export type FormItemProps = Omit<
  Partial<ElFormItemProps>,
  'prop' | 'label' | 'labelWidth' | 'required' | 'rules' | 'error' | 'showMessage' | 'inlineMessage'
> & {
  labelWidth?: string | number
  required?: boolean
  rules?: Recordable
  error?: string
  showMessage?: boolean
  inlineMessage?: boolean
  style?: CSSProperties
  // schema 级插槽渲染函数（不会透传到 ElFormItem）；同名模板插槽 #field / #field-label / #field-error 优先
  slots?: {
    // 替换表单组件，参数为表单数据
    default?: (formModel: Recordable) => VNodeChild
    // ElFormItem label 插槽，参数为 { label }
    label?: (...args: any[]) => VNodeChild
    // ElFormItem error 插槽，参数为 { error }
    error?: (...args: any[]) => VNodeChild
  }
}

export type FormSchema = {
  // 唯一值
  field: string
  // 标题
  label?: string
  // 提示
  labelMessage?: string
  // col组件属性
  colProps?: ColProps
  // 表单组件属性，具体可以查看element-plus文档；on 为组件事件，slots 为表单组件的插槽：
  // 值为函数时是渲染函数（插槽名 camelCase 转 kebab-case），值为 true 等标记时对应模板插槽 #${field}-xxx，详见 Form/README.md
  componentProps?: { slots?: Recordable } & ComponentProps
  // formItem组件属性
  formItemProps?: FormItemProps
  // 渲染的组件
  component?: ComponentName
  // 初始值
  value?: FormValueType
  // 样式隐藏，类似 v-show：表单项保持挂载，保留值、组件实例、选项及校验规则（参考上游 0f531fd1d、9a5c7bcb5 的意图）
  hidden?: boolean
  // 移除，类似 v-if：不渲染表单项，并从表单数据中删除该值（setValues / resetFields 后也不会写回）
  remove?: boolean
  // 远程加载下拉项
  api?: <T = any>() => AxiosPromise<T>
  // 远程加载选项：仅在 componentProps.options / data 为空时调用一次，返回选项数组；
  // TreeSelect / Transfer 写入 componentProps.data，其余写入 componentProps.options
  optionApi?: () => Promise<any[]> | any[]
}

// ElForm 原生属性（参考上游 674d76002）：类型取当前 Element Plus 的 FormProps，运行时仍由 Form 透传给 ElForm
type ElFormNativeProps = Partial<
  Pick<
    ElFormProps,
    | 'rules'
    | 'inline'
    | 'labelPosition'
    | 'labelSuffix'
    | 'hideRequiredAsterisk'
    | 'requireAsteriskPosition'
    | 'showMessage'
    | 'inlineMessage'
    | 'statusIcon'
    | 'validateOnRuleChange'
    | 'size'
    | 'disabled'
    | 'scrollToError'
    | 'scrollIntoViewOptions'
  >
>

export type FormProps = {
  schema?: FormSchema[]
  isCol?: boolean
  model?: Recordable
  autoSetPlaceholder?: boolean
  isCustom?: boolean
  labelWidth?: string | number
  // schema 移除字段后是否同时删除其值，默认 false（保留）
  pruneRemovedFields?: boolean
} & ElFormNativeProps &
  Recordable
