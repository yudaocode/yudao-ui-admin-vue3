import Form from './src/Form.vue'
import { ElForm, ElFormItem } from 'element-plus'
import type { FormSchema, FormSetPropsType } from './src/types'

// 与上游一致的类型入口；类型定义在 ./src/types（参考上游 9eb87ad13 Form/src/types/index.ts）
export type {
  FormSchema,
  FormSetPropsType,
  FormSetPropsType as FormSetProps,
  FormItemProps,
  FormValueType
} from './src/types'
export type {
  ComponentName,
  ComponentOptions,
  ComponentOptionsAlias,
  ComponentOptionsProps,
  ComponentProps,
  ColProps,
  RadioButtonComponentProps
} from './src/types'
// 组件名运行时枚举与可选的组件属性命名类型（参考上游 28d1654b2、1d0f4b4c3、2261f4997、c5b545d2c、283bc58d4）
export { ComponentNameEnum } from './src/componentProps'
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
  CheckboxButtonComponentProps,
  FormComponentEvents,
  FormComponentSlot,
  FormComponentSlots,
  FormComponentExtraProps,
  RadioGroupComponentProps,
  CheckboxGroupComponentProps,
  DatePickerComponentProps,
  TimePickerComponentProps,
  TimeSelectComponentProps,
  DividerComponentProps,
  TreeSelectComponentProps,
  UploadComponentProps
} from './src/componentProps'
// Form 组件属性与占位符类型入口（参考上游 26dc886f8），仅类型导出
export type { FormProps, PlaceholderModel } from './src/types'

export interface FormExpose {
  setValues: (data: Recordable) => void
  setProps: (props: Recordable) => void
  delSchema: (field: string) => void
  addSchema: (formSchema: FormSchema, index?: number) => void
  setSchema: (schemaProps: FormSetPropsType[]) => void
  formModel: Recordable
  getElFormRef: () => ComponentRef<typeof ElForm>
  // 按 field 获取表单组件实例，插槽自定义渲染的字段返回 undefined
  getComponentExpose: (field: string) => any
  // 按 field 获取 form-item 实例
  getFormItemExpose: (field: string) => ComponentRef<typeof ElFormItem> | undefined
}

export { Form }
