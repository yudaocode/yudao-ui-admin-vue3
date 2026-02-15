/** MES 物料/产品标识枚举 */
export const MesItemOrProductEnum = {
  ITEM: {
    label: '物料',
    value: 'ITEM'
  },
  PRODUCT: {
    label: '产品',
    value: 'PRODUCT'
  }
} as const

/** 获取物料/产品标识的标签 */
export const getItemOrProductLabel = (value: string): string => {
  for (const item of Object.values(MesItemOrProductEnum)) {
    if (item.value === value) {
      return item.label
    }
  }
  return value
}
