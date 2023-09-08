import { fenToYuan } from '@/utils'
import { TableColumnCtx } from 'element-plus'

// 格式化金额【分转元】
export const fenToYuanFormat = (
  row: any,
  column: TableColumnCtx<any>,
  cellValue: any,
  index: number
) => {
  return `￥${fenToYuan(cellValue)}`
}
