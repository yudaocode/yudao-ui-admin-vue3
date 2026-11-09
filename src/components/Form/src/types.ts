import { FormSchema } from '@/types/form'

export interface PlaceholderModel {
  placeholder?: string
  startPlaceholder?: string
  endPlaceholder?: string
  rangeSeparator?: string
}

export type FormProps = {
  schema?: FormSchema[]
  isCol?: boolean
  model?: Recordable
  autoSetPlaceholder?: boolean
  isCustom?: boolean
  labelWidth?: string | number
  // schema 移除字段后是否同时删除其值，默认 false（保留）
  pruneRemovedFields?: boolean
} & Recordable
