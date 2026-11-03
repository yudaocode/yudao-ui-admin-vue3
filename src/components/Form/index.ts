import Form from './src/Form.vue'
import { ElForm, ElFormItem } from 'element-plus'
import { FormSchema, FormSetPropsType } from '@/types/form'

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
