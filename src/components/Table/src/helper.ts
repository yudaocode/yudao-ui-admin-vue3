import type { ColumnFixed, TableColumn } from './types'

// 列设置中不参与显隐/排序/固定的特殊列（与上游 constants 一致，仅在 Table 内使用）
export const DEFAULT_FILTER_COLUMN = ['expand', 'selection']

// 列的稳定标识（列设置偏好与 ElTableColumn 的 VNode key 共用）：
// 优先显式 columnKey（区分同 field 的列），其次 field，再次 type，最后 label
export const getColumnKey = (column: TableColumn): string =>
  column.columnKey || column.field || (column.type ? `__type_${column.type}` : column.label || '')

// 统一列固定值：true 与 ElTableColumn 一致视为 left，其余非 left/right 视为不固定
export const normalizeColumnFixed = (fixed: unknown): ColumnFixed => {
  if (fixed === 'right') return 'right'
  if (fixed === 'left' || fixed === true) return 'left'
  return false
}

export const setIndex = (reserveIndex: boolean, index: number, size: number, current: number) => {
  const newIndex = index + 1
  if (reserveIndex) {
    return size * (current - 1) + newIndex
  } else {
    return newIndex
  }
}
