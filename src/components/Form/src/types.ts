import type { FormProps as ElFormProps } from 'element-plus'
import { FormSchema } from '@/types/form'

export interface PlaceholderModel {
  placeholder?: string
  startPlaceholder?: string
  endPlaceholder?: string
  rangeSeparator?: string
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
