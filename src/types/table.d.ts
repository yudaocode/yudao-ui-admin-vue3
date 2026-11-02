// 兼容原有的 @/types/table 导入路径，类型统一定义在 Table 组件的 types.ts 中
import type { TableColumn } from '@/components/Table/src/types'

export type {
  ColumnFixed,
  Pagination,
  TableColumn,
  TableSetProps,
  TableSetPropsType,
  TableSlotDefault
} from '@/components/Table/src/types'

export type VxeTableColumn = {
  field: string
  title?: string
  children?: TableColumn[]
} & Recordable
