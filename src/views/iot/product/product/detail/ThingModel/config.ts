/** dataSpecs 数值型数据结构 */
export interface DataSpecsNumberDataVO {
  dataType: 'INT' | 'FLOAT' | 'DOUBLE' // 数据类型，取值为 INT、FLOAT 或 DOUBLE
  max: string // 最大值，必须与 dataType 设置一致，且为 STRING 类型
  min: string // 最小值，必须与 dataType 设置一致，且为 STRING 类型
  step: string // 步长，必须与 dataType 设置一致，且为 STRING 类型
  precise?: string // 精度，当 dataType 为 FLOAT 或 DOUBLE 时可选
  defaultValue?: string // 默认值，可选
  unit: string // 单位的符号
  unitName: string // 单位的名称
}

/** dataSpecs 文本型数据结构 */
export interface DataSpecsTextDataVO {
  dataType: 'TEXT'
  length: number
}

/** dataSpecs 枚举型数据结构 */
export interface DataSpecsEnumDataVO {
  dataType: 'ENUM' | 'BOOL'
  defaultValue?: string // 默认值，可选
  name: string // 枚举项的名称
  value: number // 枚举值
}

/** 属性值的数据类型 */
export const DataSpecsDataType = {
  INT: 'int',
  FLOAT: 'float',
  DOUBLE: 'double',
  ENUM: 'enum',
  BOOL: 'bool',
  TEXT: 'text',
  DATE: 'date',
  STRUCT: 'struct',
  ARRAY: 'array'
}
