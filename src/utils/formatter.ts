import { floatToFixed2 } from '@/utils'

// 格式化金额【分转元】
// @ts-ignore
export const fenToYuanFormat = (_, _, cellValue: any, _) => {
  return `￥${floatToFixed2(cellValue)}`
}
