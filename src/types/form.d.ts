import type { CSSProperties, VNodeChild } from 'vue'
import { ColProps, ComponentProps, ComponentName } from '@/types/components'
import type { AxiosPromise } from 'axios'
import type { FormItemProps as ElFormItemProps } from 'element-plus'

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
