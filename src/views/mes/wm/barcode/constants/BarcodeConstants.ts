// TODO @AI：迁移到 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/mes/utils/constants.ts
/**
 * 条码格式枚举
 */
export enum BarcodeFormatEnum {
  QR_CODE = 1,
  EAN13 = 2,
  CODE39 = 3,
  UPC_A = 4
}

/**
 * 条码格式映射表
 */
// TODO @AI：拿到需要的地方，貌似就一次性的；
export const BARCODE_FORMAT_MAP: Record<BarcodeFormatEnum, string> = {
  [BarcodeFormatEnum.QR_CODE]: 'QR_CODE',
  [BarcodeFormatEnum.EAN13]: 'EAN13',
  [BarcodeFormatEnum.CODE39]: 'CODE39',
  [BarcodeFormatEnum.UPC_A]: 'UPC_A'
}

/**
 * 是否为有效的条码格式
 */
// TODO @AI：去掉，拿到需要的地方；
export const isValidBarcodeFormat = (format: number): boolean => {
  return Object.values(BarcodeFormatEnum).includes(format)
}
