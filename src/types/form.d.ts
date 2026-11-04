import type { CSSProperties, VNodeChild } from 'vue'
import { ColProps, ComponentProps, ComponentName } from '@/types/components'
import type { AxiosPromise } from 'axios'

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

export type FormItemProps = {
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
  // 表单组件属性，slots对应的是表单组件的插槽，规则：${field}-xxx，具体可以查看element-plus文档
  componentProps?: { slots?: Recordable } & ComponentProps
  // formItem组件属性
  formItemProps?: FormItemProps
  // 渲染的组件
  component?: ComponentName
  // 初始值
  value?: FormValueType
  // 是否隐藏
  hidden?: boolean
  // 远程加载下拉项
  api?: <T = any>() => AxiosPromise<T>
  // 远程加载选项：仅在 componentProps.options / data 为空时调用一次，返回选项数组；
  // TreeSelect / Transfer 写入 componentProps.data，其余写入 componentProps.options
  optionApi?: () => Promise<any[]> | any[]
}
