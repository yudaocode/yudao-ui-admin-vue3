import {isEmpty} from '@/utils/is'

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

/** 公共校验规则 */
export const ThingModelFormRules = {
  name: [
    { required: true, message: '功能名称不能为空', trigger: 'blur' },
    {
      pattern: /^[\u4e00-\u9fa5a-zA-Z0-9][\u4e00-\u9fa5a-zA-Z0-9\-_/\.]{0,29}$/,
      message:
        '支持中文、大小写字母、日文、数字、短划线、下划线、斜杠和小数点，必须以中文、英文或数字开头，不超过 30 个字符',
      trigger: 'blur'
    }
  ],
  type: [{ required: true, message: '功能类型不能为空', trigger: 'blur' }],
  identifier: [
    { required: true, message: '标识符不能为空', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_]{1,50}$/,
      message: '支持大小写字母、数字和下划线，不超过 50 个字符',
      trigger: 'blur'
    },
    {
      validator: (_: any, value: string, callback: any) => {
        const reservedKeywords = ['set', 'get', 'post', 'property', 'event', 'time', 'value']
        if (reservedKeywords.includes(value)) {
          callback(
            new Error(
              'set, get, post, property, event, time, value 是系统保留字段，不能用于标识符定义'
            )
          )
        } else if (/^\d+$/.test(value)) {
          callback(new Error('标识符不能是纯数字'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  'property.dataSpecs.childDataType': [{ required: true, message: '元素类型不能为空' }],
  'property.dataSpecs.size': [
    { required: true, message: '元素个数不能为空' },
    {
      validator: (_: any, value: any, callback: any) => {
        if (isEmpty(value)) {
          callback(new Error('元素个数不能为空'))
          return
        }
        if (isNaN(Number(value))) {
          callback(new Error('元素个数必须是数字'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
}
