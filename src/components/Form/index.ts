import Form from './src/Form.vue'
import { ElForm, ElFormItem } from 'element-plus'
import { FormSchema, FormSetPropsType } from '@/types/form'

// 与上游一致的类型入口；类型定义仍在 @/types/form、@/types/components
export type {
  FormSchema,
  FormSetPropsType,
  FormSetPropsType as FormSetProps,
  FormItemProps,
  FormValueType
} from '@/types/form'
export type {
  ComponentName,
  ComponentOptions,
  ComponentOptionsAlias,
  ComponentProps,
  ColProps
} from '@/types/components'

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
