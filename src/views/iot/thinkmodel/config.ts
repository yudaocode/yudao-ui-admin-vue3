/** dataSpecs 数值型数据结构 */
export interface DataSpecsNumberDataVO {
  dataType: 'int' | 'float' | 'double' // 数据类型，取值为 INT、FLOAT 或 DOUBLE
  max: string // 最大值，必须与 dataType 设置一致，且为 STRING 类型
  min: string // 最小值，必须与 dataType 设置一致，且为 STRING 类型
  step: string // 步长，必须与 dataType 设置一致，且为 STRING 类型
  precise?: string // 精度，当 dataType 为 FLOAT 或 DOUBLE 时可选
  defaultValue?: string // 默认值，可选
  unit: string // 单位的符号
  unitName: string // 单位的名称
}

/** dataSpecs 枚举型数据结构 */
export interface DataSpecsEnumOrBoolDataVO {
  dataType: 'enum' | 'bool'
  defaultValue?: string // 默认值，可选
  name: string // 枚举项的名称
  value: number | undefined // 枚举值
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
} as const

/** 物体模型数据类型配置项 */
export const dataTypeOptions = [
  { value: DataSpecsDataType.INT, label: 'int32 (整数型)' },
  { value: DataSpecsDataType.FLOAT, label: 'float (单精度浮点型)' },
  { value: DataSpecsDataType.DOUBLE, label: 'double (双精度浮点型)' },
  { value: DataSpecsDataType.ENUM, label: 'enum(枚举型)' },
  { value: DataSpecsDataType.BOOL, label: 'bool (布尔型)' },
  { value: DataSpecsDataType.TEXT, label: 'text (文本型)' },
  { value: DataSpecsDataType.DATE, label: 'date (时间型)' },
  { value: DataSpecsDataType.STRUCT, label: 'struct (结构体)' },
  { value: DataSpecsDataType.ARRAY, label: 'array (数组)' }
]

/** 获得物体模型数据类型配置项名称 */
export const getDataTypeOptionsLabel = (value: string) => {
  return dataTypeOptions.find((option) => option.value === value)?.label
}
