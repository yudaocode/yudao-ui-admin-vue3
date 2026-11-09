import type {
  AllowedComponentProps,
  HTMLAttributes,
  StyleValue,
  VNodeChild,
  VNodeProps,
  VNodeRef
} from 'vue'
import type {
  AutocompleteEmits,
  AutocompleteProps,
  CascaderComponentProps as ElCascaderComponentProps,
  CascaderEmits,
  CheckboxGroupEmits,
  CheckboxGroupProps,
  ColorPickerEmits,
  ColorPickerProps,
  DatePickerProps,
  DividerProps,
  ElTreeSelect,
  InputEmits,
  InputNumberEmits,
  InputNumberProps,
  InputProps,
  RadioGroupEmits,
  RadioGroupProps,
  RateEmits,
  RateProps,
  SelectPropsPublic,
  SelectV2Props,
  SwitchEmits,
  SwitchProps,
  TimePickerDefaultProps,
  TimeSelectProps,
  TransferDirection,
  TransferKey,
  TransferProps,
  UploadProps,
  selectEmits
} from 'element-plus'
import type {
  ComponentEvents,
  ComponentName,
  ComponentOptions,
  ComponentOptionsAlias,
  ComponentOptionsProps
} from '@/types/components'

/**
 * Form 组件名（运行时枚举，参考上游 28d1654b2，名称沿用上游 RADIO_GROUP / I_AGREE 等写法）：
 * 值与 componentMap 的键、ComponentName 字符串联合一致，schema.component 仍可直接写字符串
 */
export enum ComponentNameEnum {
  RADIO = 'Radio',
  RADIO_GROUP = 'RadioGroup',
  RADIO_BUTTON = 'RadioButton',
  CHECKBOX = 'Checkbox',
  CHECKBOX_GROUP = 'CheckboxGroup',
  CHECKBOX_BUTTON = 'CheckboxButton',
  INPUT = 'Input',
  AUTOCOMPLETE = 'Autocomplete',
  INPUT_NUMBER = 'InputNumber',
  SELECT = 'Select',
  CASCADER = 'Cascader',
  SWITCH = 'Switch',
  SLIDER = 'Slider',
  TIME_PICKER = 'TimePicker',
  DATE_PICKER = 'DatePicker',
  RATE = 'Rate',
  COLOR_PICKER = 'ColorPicker',
  TRANSFER = 'Transfer',
  DIVIDER = 'Divider',
  TIME_SELECT = 'TimeSelect',
  SELECT_V2 = 'SelectV2',
  TREE_SELECT = 'TreeSelect',
  INPUT_PASSWORD = 'InputPassword',
  EDITOR = 'Editor',
  UPLOAD_IMG = 'UploadImg',
  UPLOAD_IMGS = 'UploadImgs',
  UPLOAD_FILE = 'UploadFile',
  UPLOAD = 'Upload',
  I_AGREE = 'IAgree',
  JSON_EDITOR = 'JsonEditor',
  ICON_PICKER = 'IconPicker'
}

// 编译期校验：枚举值与 ComponentName 联合必须一致（两处增删组件名时需同步），不从 Form 入口导出
type ExactComponentName<
  A extends ComponentName = `${ComponentNameEnum}`,
  B extends `${ComponentNameEnum}` = ComponentName
> = [A, B]
export type ComponentNameEnumCheck = ExactComponentName

// 事件监听：参数与 Element Plus 声明的事件一致，可为函数或函数数组（与 Form 运行时一致）
type FormComponentListener<A extends any[]> = (...args: A) => any

/**
 * 组件事件：键为 Element Plus 声明的事件名（如 change、visible-change）并按 SDK 参数校验；
 * 其他写法（如 camelCase 的 visibleChange）仍按 ComponentEvents 接受，由 Form 转为 onXxx 监听
 */
export type FormComponentEvents<E> = {
  [K in keyof E]?: E[K] extends (...args: infer A) => any
    ? FormComponentListener<A> | FormComponentListener<A>[]
    : never
} & ComponentEvents

/**
 * 组件插槽：函数为渲染函数（插槽名 camelCase 转 kebab-case，参数为组件插槽原参数；
 * Select / Radio / Checkbox 类的 default 参数为 options，Select 另有 optionDefault / optionGroupDefault）；
 * true 为模板插槽标记，对应 Form 的模板插槽 #字段-插槽名
 */
export type FormComponentSlot = ((...args: any[]) => VNodeChild) | boolean
export type FormComponentSlots = Record<string, FormComponentSlot | undefined>

// Form 在 SDK 属性之外额外处理的字段
export interface FormComponentExtraProps<E> {
  on?: FormComponentEvents<E>
  slots?: FormComponentSlots
  style?: StyleValue
  class?: HTMLAttributes['class']
  // 组件 ref（参考上游 097b32e1a），Form 运行时已按 Vue 原生语义透传：字符串、ref 对象或回调函数
  ref?: VNodeRef
}

// 自动渲染选项的字段（Select / Radio / Checkbox 类）：字段别名 optionsAlias 优先，其次 props
interface FormOptionsProps {
  options?: ComponentOptions[]
  optionsAlias?: ComponentOptionsAlias
  props?: ComponentOptionsProps
}

/*
 * 以下命名类型为可选的显式标注，参考上游：Input 28d1654b2，Autocomplete / InputNumber 1d0f4b4c3，
 * Select 2261f4997（SelectV2 4d04734e1），Cascader / Switch / Rate / ColorPicker / Transfer c5b545d2c，
 * InputPassword / CheckboxButton 及基于 SDK Partial 的写法 283bc58d4。
 * 属性取当前 Element Plus 的 SDK 类型（Partial），modelValue 由 Form 绑定，不在此声明。
 * 不并入 FormSchema.componentProps（保持原宽松类型），需要提示时显式标注，
 * 如 componentProps: { ... } satisfies SelectComponentProps
 */

export interface InputComponentProps
  extends Partial<Omit<InputProps, 'modelValue'>>, FormComponentExtraProps<InputEmits> {}

export interface AutocompleteComponentProps
  extends
    Partial<Omit<AutocompleteProps, 'modelValue'>>,
    FormComponentExtraProps<AutocompleteEmits> {}

export interface InputNumberComponentProps
  extends
    Partial<Omit<InputNumberProps, 'modelValue'>>,
    FormComponentExtraProps<InputNumberEmits> {}

// Select：选项由 Form 渲染为 ElOption / ElOptionGroup，options、props 按 Form 的选项协议
export interface SelectComponentProps
  extends
    Partial<Omit<SelectPropsPublic, 'modelValue' | 'options' | 'props'>>,
    FormComponentExtraProps<typeof selectEmits>,
    FormOptionsProps {
  // 为 true 时选项内容使用模板插槽 #字段-option
  optionsSlot?: boolean
}

// SelectV2：options / props 原样交给 ElSelectV2；事件与 ElSelect 一致
export interface SelectV2ComponentProps
  extends
    Partial<Omit<SelectV2Props, 'modelValue' | 'style'>>,
    FormComponentExtraProps<typeof selectEmits> {}

// Cascader：options / props 原样交给 ElCascader（props 支持 disabled / leaf 函数、lazyLoad 等）
export interface CascaderComponentProps
  extends
    Partial<Omit<ElCascaderComponentProps, 'modelValue'>>,
    FormComponentExtraProps<CascaderEmits> {}

export interface SwitchComponentProps
  extends Partial<Omit<SwitchProps, 'modelValue'>>, FormComponentExtraProps<SwitchEmits> {}

export interface RateComponentProps
  extends Partial<Omit<RateProps, 'modelValue'>>, FormComponentExtraProps<RateEmits> {}

export interface ColorPickerComponentProps
  extends
    Partial<Omit<ColorPickerProps, 'modelValue'>>,
    FormComponentExtraProps<ColorPickerEmits> {}

// FormTransfer 对外的键：ElTransfer 的 string / number 键，以及解码后的 boolean 键
type FormTransferKey = TransferKey | boolean

// FormTransfer 转发的事件：参数结构与 ElTransfer 一致，键数组为解码后的原始类型（可含 boolean）
type FormTransferEmits = {
  'update:modelValue': (value: FormTransferKey[]) => any
  change: (
    value: FormTransferKey[],
    direction: TransferDirection,
    movedKeys: FormTransferKey[]
  ) => any
  'left-check-change': (value: FormTransferKey[], movedKeys?: FormTransferKey[]) => any
  'right-check-change': (value: FormTransferKey[], movedKeys?: FormTransferKey[]) => any
}

// Transfer：Form 使用 FormTransfer 适配 ElTransfer，未传 data 时由 options + optionsAlias 生成；
// 键可以是 boolean（内部可逆编码），默认勾选项与事件参数同样支持
export interface TransferComponentProps
  extends
    Partial<Omit<TransferProps, 'modelValue' | 'leftDefaultChecked' | 'rightDefaultChecked'>>,
    FormComponentExtraProps<FormTransferEmits> {
  options?: ComponentOptions[]
  optionsAlias?: ComponentOptionsAlias
  leftDefaultChecked?: FormTransferKey[]
  rightDefaultChecked?: FormTransferKey[]
}

// InputPassword：芋道封装组件，自身属性为 strength（是否显示密码强度）；
// 其余属性透传给内部 ElInput，组件不转发插槽。type 默认 password，显隐使用 ElInput 内置 showPassword；
// 显式传入的 type / showPassword 优先，未传 showPassword 时仅 type 为 password 才开启（参考上游 207c5b3fc）
export interface InputPasswordComponentProps
  extends
    Partial<Omit<InputProps, 'modelValue'>>,
    Omit<FormComponentExtraProps<InputEmits>, 'slots'> {
  strength?: boolean
}

// CheckboxButton：Form 渲染为 ElCheckboxGroup，options 渲染为 ElCheckboxButton，属性取 CheckboxGroup
export interface CheckboxButtonComponentProps
  extends
    Partial<Omit<CheckboxGroupProps, 'modelValue' | 'options' | 'props' | 'type'>>,
    FormComponentExtraProps<CheckboxGroupEmits>,
    FormOptionsProps {}

// SDK 未导出事件类型的组件：事件仍按 ComponentEvents 接受
type FormComponentNoEmits = Record<never, never>

// RadioGroup（Radio 同）：Form 渲染为 ElRadioGroup，options 按 Form 的选项协议渲染为 ElRadio（参考上游 283bc58d4）
export interface RadioGroupComponentProps
  extends
    Partial<Omit<RadioGroupProps, 'modelValue' | 'options' | 'props' | 'type'>>,
    FormComponentExtraProps<RadioGroupEmits>,
    FormOptionsProps {}

// CheckboxGroup（Checkbox 同）：Form 渲染为 ElCheckboxGroup，options 按 Form 的选项协议渲染为 ElCheckbox（参考上游 283bc58d4）
export interface CheckboxGroupComponentProps
  extends
    Partial<Omit<CheckboxGroupProps, 'modelValue' | 'options' | 'props' | 'type'>>,
    FormComponentExtraProps<CheckboxGroupEmits>,
    FormOptionsProps {}

// DatePicker / TimePicker / TimeSelect / Divider（参考上游 283bc58d4、46b35e48b）
export interface DatePickerComponentProps
  extends
    Partial<Omit<DatePickerProps, 'modelValue'>>,
    FormComponentExtraProps<FormComponentNoEmits> {}

export interface TimePickerComponentProps
  extends
    Partial<Omit<TimePickerDefaultProps, 'modelValue'>>,
    FormComponentExtraProps<FormComponentNoEmits> {}

export interface TimeSelectComponentProps
  extends
    Partial<Omit<TimeSelectProps, 'modelValue'>>,
    FormComponentExtraProps<FormComponentNoEmits> {}

export interface DividerComponentProps
  extends Partial<DividerProps>, FormComponentExtraProps<FormComponentNoEmits> {}

// TreeSelect：SDK 未导出属性类型，取 ElTreeSelect 组件实例属性（Select + Tree 组合，参考上游 002d03a0a），
// 去掉 Vue 通用的 key / ref / class / style 后由本地额外字段声明；data / props（含 disabled 函数）原样交给 ElTreeSelect
type ElTreeSelectProps = Omit<
  InstanceType<typeof ElTreeSelect>['$props'],
  'modelValue' | 'onUpdate:modelValue' | keyof VNodeProps | keyof AllowedComponentProps
>

export interface TreeSelectComponentProps
  extends Partial<ElTreeSelectProps>, FormComponentExtraProps<FormComponentNoEmits> {}

// Upload：原生 ElUpload，文件列表由 Form 绑定 file-list（参考上游 c181887f7）；
// beforeUpload / onChange / httpRequest 等钩子为属性而非事件
export interface UploadComponentProps
  extends Partial<Omit<UploadProps, 'fileList'>>, FormComponentExtraProps<FormComponentNoEmits> {}
