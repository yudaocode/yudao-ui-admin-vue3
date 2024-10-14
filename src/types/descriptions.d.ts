export interface DescriptionsSchema {
  span?: number // 占多少分
  field: string // 字段名
  label?: string // label名
  mappedField?: string // 字段映射
  width?: string | number
  minWidth?: string | number
  align?: 'left' | 'center' | 'right'
  labelAlign?: 'left' | 'center' | 'right'
  className?: string
  labelClassName?: string
  dateFormat?: string // add by 星语：支持时间的格式化
  dictType?: string // add by 星语：支持 dict 字典数据
}
