/**
 * WMS 展示格式化和表单配置
 */

import { isNullOrUnDef } from '@/utils/is'

/** 金额小数位 */
export const PRICE_PRECISION = 2
/** 重量小数位 */
export const WEIGHT_PRECISION = 3
/** 长宽高小数位 */
export const DIMENSION_PRECISION = 1

export const formatNumber = (
  value?: number | string | null,
  digit: number = PRICE_PRECISION
) => {
  if (isNullOrUnDef(value)) {
    return ''
  }
  if (typeof value === 'string' && value.trim() === '') {
    return ''
  }
  const numberValue = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(numberValue)) {
    return ''
  }
  return numberValue.toFixed(digit)
}

/** 格式化金额，保留 2 位小数 */
export const formatPrice = (value?: number | string | null) => {
  return formatNumber(value, PRICE_PRECISION)
}

/** 格式化重量，保留 3 位小数 */
export const formatWeight = (value?: number | string | null) => {
  return formatNumber(value, WEIGHT_PRECISION)
}

/** 格式化长宽高，保留 1 位小数 */
export const formatDimension = (value?: number | string | null) => {
  return formatNumber(value, DIMENSION_PRECISION)
}

/** 格式化长宽高组合，保留 1 位小数 */
export const formatDimensionText = (
  length?: number | string | null,
  width?: number | string | null,
  height?: number | string | null
) => {
  if (!isNullOrUnDef(length) && !isNullOrUnDef(width) && !isNullOrUnDef(height)) {
    return [formatDimension(length), formatDimension(width), formatDimension(height)].join(' * ')
  }
  return [
    !isNullOrUnDef(length) ? `长：${formatDimension(length)}` : undefined,
    !isNullOrUnDef(width) ? `宽：${formatDimension(width)}` : undefined,
    !isNullOrUnDef(height) ? `高：${formatDimension(height)}` : undefined
  ]
    .filter(Boolean)
    .join(' ')
}
