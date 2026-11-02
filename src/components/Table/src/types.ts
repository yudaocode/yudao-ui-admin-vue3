import type { ComponentSize } from 'element-plus'
import type { CSSProperties, VNodeChild } from 'vue'

// 注意：本文件是 Table 类型的唯一定义处，@/types/table 从这里重导出，这里不能反向导入 @/types/table

/** 列固定方式：false 表示不固定 */
export type ColumnFixed = false | 'left' | 'right'

export interface TableColumn {
  field: string
  label?: string
  type?: string
  /**
   * 是否隐藏
   */
  hidden?: boolean
  children?: TableColumn[]
  slots?: {
    default?: (...args: any[]) => VNodeChild
    header?: (...args: any[]) => VNodeChild
  }
  index?: number | ((index: number) => number)
  columnKey?: string
  width?: string | number
  minWidth?: string | number
  // true 与 ElTableColumn 一致，等同于 left
  fixed?: boolean | 'left' | 'right'
  renderHeader?: (...args: any[]) => VNodeChild
  sortMethod?: (...args: any[]) => number
  sortBy?: string | string[] | ((...args: any[]) => string | string[])
  sortOrders?: (string | null)[]
  resizable?: boolean
  formatter?: (...args: any[]) => any
  showOverflowTooltip?: boolean
  align?: 'left' | 'center' | 'right'
  headerAlign?: 'left' | 'center' | 'right'
  className?: string
  labelClassName?: string
  selectable?: (...args: any[]) => boolean
  reserveSelection?: boolean
  filters?: Array<{ text: string; value: string }>
  filterPlacement?: string
  filterMultiple?: boolean
  filterMethod?: (...args: any[]) => boolean
  filteredValue?: string[]
  [key: string]: any
}

export interface TableSlotDefault {
  row: Recordable
  column: TableColumn
  $index: number
  [key: string]: any
}

export interface Pagination {
  small?: boolean
  background?: boolean
  pageSize?: number
  defaultPageSize?: number
  total?: number
  pageCount?: number
  pagerCount?: number
  currentPage?: number
  defaultCurrentPage?: number
  layout?: string
  pageSizes?: number[]
  popperClass?: string
  prevText?: string
  nextText?: string
  disabled?: boolean
  hideOnSinglePage?: boolean
}

export interface TableSetProps {
  field: string
  path: string
  value: any
}

// 芋道原有名称
export type TableSetPropsType = TableSetProps

// 列设置中用户确认的偏好（按顺序），只叠加在渲染列上，不写回源列
export interface ColumnPreference {
  key: string
  hidden: boolean
  fixed: ColumnFixed
}

export type TableProps = {
  pageSize?: number
  currentPage?: number
  // 是否多选
  selection?: boolean
  // 是否展开行
  expand?: boolean
  // 是否展示表格的工具栏
  showAction?: boolean
  // 是否所有的超出隐藏，优先级低于schema中的showOverflowTooltip,
  showOverflowTooltip?: boolean
  // 表头
  columns?: TableColumn[]
  // 列设置“还原”使用的默认列
  defaultColumns?: TableColumn[]
  // 是否展示分页
  pagination?: Pagination | undefined
  // 仅对 type=selection 的列有效，类型为 Boolean，为 true 则会在数据更新之后保留之前选中的数据（需指定 row-key）
  reserveSelection?: boolean
  // 加载状态
  loading?: boolean
  // 是否叠加索引
  reserveIndex?: boolean
  // 对齐方式
  align?: 'left' | 'center' | 'right'
  // 表头对齐方式
  headerAlign?: 'left' | 'center' | 'right'
  data?: Recordable
  // 图片、视频自动预览字段数组
  imagePreview?: string[]
  videoPreview?: string[]
  size?: ComponentSize
  rowKey?: string | ((row: Recordable) => string | number)
  // 自定义内容（卡片模式）
  customContent?: boolean
  cardBodyStyle?: CSSProperties
  cardBodyClass?: string
  cardWrapStyle?: CSSProperties
  cardWrapClass?: string
} & Recordable
