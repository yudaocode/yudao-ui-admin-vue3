import Search from './src/Search.vue'
import type { ElForm } from 'element-plus'
import type { FormSchema, FormSetPropsType } from '@/types/form'

// 可通过 setProps 临时覆盖的 Search 属性；值为 undefined 时取消覆盖，恢复使用组件传入的属性
export interface SearchProps {
  schema?: FormSchema[]
  isCol?: boolean
  labelWidth?: string | number
  labelPosition?: 'left' | 'right' | 'top'
  layout?: 'inline' | 'bottom'
  buttomPosition?: 'left' | 'center' | 'right'
  buttonPosition?: 'left' | 'center' | 'right'
  showSearch?: boolean
  showReset?: boolean
  expand?: boolean
  showExpand?: boolean
  expandField?: string
  inline?: boolean
  model?: Recordable
  searchLoading?: boolean
  resetLoading?: boolean
  removeNoValueItem?: boolean
}

export interface SearchExpose {
  getFormData: <T = Recordable>(filterEmptyVal?: boolean) => Promise<T>
  getElFormExpose: () => Promise<ComponentRef<typeof ElForm> | undefined>
  setValues: (data: Recordable) => void
  setProps: (props?: SearchProps) => void
  setSchema: (schemaProps: FormSetPropsType[]) => void
  addSchema: (formSchema: FormSchema, index?: number) => void
  delSchema: (field: string) => void
}

export { Search }
