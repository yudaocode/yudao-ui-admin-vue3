/**
 * WMS 展示格式化和表单配置
 */

import { isNullOrUnDef } from '@/utils/is'

type DecimalValue = number | string | null | undefined

/** 数量小数位 */
export const QUANTITY_PRECISION = 2
/** 金额小数位 */
export const PRICE_PRECISION = 2
/** 重量小数位 */
export const WEIGHT_PRECISION = 3
/** 长宽高小数位 */
export const DIMENSION_PRECISION = 1

const toFiniteDecimal = (value: DecimalValue) => {
  if (isNullOrUnDef(value)) {
    return undefined
  }
  if (typeof value === 'string' && value.trim() === '') {
    return undefined
  }
  const decimalValue = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(decimalValue)) {
    return undefined
  }
  return decimalValue
}

const sumDecimal = <T>(list: T[], getter: (item: T) => DecimalValue) => {
  return list.reduce((sum, item) => {
    const decimalValue = toFiniteDecimal(getter(item))
    return decimalValue === undefined ? sum : sum + decimalValue
  }, 0)
}

/** 格式化数量 */
export const formatQuantity = (value?: number | string | null) => {
  const decimalValue = toFiniteDecimal(value)
  return decimalValue === undefined ? '' : decimalValue.toFixed(QUANTITY_PRECISION)
}

/** 格式化金额 */
export const formatPrice = (value?: number | string | null) => {
  const decimalValue = toFiniteDecimal(value)
  return decimalValue === undefined ? '' : decimalValue.toFixed(PRICE_PRECISION)
}

/** 汇总数量 */
export const sumQuantity = <T>(list: T[], getter: (item: T) => DecimalValue) => {
  return sumDecimal(list, getter)
}

/** 汇总金额 */
export const sumPrice = <T>(list: T[], getter: (item: T) => DecimalValue) => {
  return sumDecimal(list, getter)
}

/** 格式化汇总数量 */
export const formatSumQuantity = <T>(list: T[], getter: (item: T) => DecimalValue) => {
  return formatQuantity(sumQuantity(list, getter))
}

/** 格式化汇总金额 */
export const formatSumPrice = <T>(list: T[], getter: (item: T) => DecimalValue) => {
  return formatPrice(sumPrice(list, getter))
}

/** 格式化重量 */
export const formatWeight = (value?: number | string | null) => {
  const decimalValue = toFiniteDecimal(value)
  return decimalValue === undefined ? '' : decimalValue.toFixed(WEIGHT_PRECISION)
}

/** 格式化长宽高 */
export const formatDimension = (value?: number | string | null) => {
  const decimalValue = toFiniteDecimal(value)
  return decimalValue === undefined ? '' : decimalValue.toFixed(DIMENSION_PRECISION)
}

/** 格式化长宽高组合 */
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
