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
// TODO @puhui999：这个枚举类，要不放到 dict 里？ 这个全是当常量来使用的不好放 dict 里 🤣
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
// TODO @puhui999：搞到字典里；label 只使用（）部分，就是整数型、单精度浮点型等，这种哈。这样，拼接 value(label) 就可以渲染出来，通用性更强
export const dataTypeOptions = [
  { value: DataSpecsDataType.INT, label: '整数型' },
  { value: DataSpecsDataType.FLOAT, label: '单精度浮点型' },
  { value: DataSpecsDataType.DOUBLE, label: '双精度浮点型' },
  { value: DataSpecsDataType.ENUM, label: '枚举型' },
  { value: DataSpecsDataType.BOOL, label: '布尔型' },
  { value: DataSpecsDataType.TEXT, label: '文本型' },
  { value: DataSpecsDataType.DATE, label: '时间型' },
  { value: DataSpecsDataType.STRUCT, label: '结构体' },
  { value: DataSpecsDataType.ARRAY, label: '数组' }
]

/** 获得物体模型数据类型配置项名称 */
export const getDataTypeOptionsLabel = (value: string) => {
  if (isEmpty(value)) {
    return value
  }
  const dataType = dataTypeOptions.find((option) => option.value === value)
  return dataType && `${dataType.value}(${dataType.label})`
}

// IOT 产品物模型类型枚举类
export const ThingModelType = {
  PROPERTY: 1, // 属性
  SERVICE: 2, // 服务
  EVENT: 3 // 事件
} as const

// IOT 产品物模型访问模式枚举类
export const ThingModelAccessMode = {
  READ_WRITE: {
    label: '读写',
    value: 'rw'
  },
  READ_ONLY: {
    label: '只读',
    value: 'r'
  }
} as const

// IOT 产品物模型服务调用方式枚举
export const ThingModelServiceCallType = {
  ASYNC: {
    label: '异步调用',
    value: 'async'
  },
  SYNC: {
    label: '同步调用',
    value: 'sync'
  }
} as const
export const getCallTypeByValue = (value: string): string | undefined =>
  Object.values(ThingModelServiceCallType).find((type) => type.value === value)?.label

// IOT 产品物模型事件类型枚举
export const ThingModelEventType = {
  INFO: {
    label: '信息',
    value: 'info'
  },
  ALERT: {
    label: '告警',
    value: 'alert'
  },
  ERROR: {
    label: '故障',
    value: 'error'
  }
} as const
export const getEventTypeByValue = (value: string): string | undefined =>
  Object.values(ThingModelEventType).find((type) => type.value === value)?.label

// IOT 产品物模型参数是输入参数还是输出参数
export const ThingModelParamDirection = {
  INPUT: 'input', // 输入参数
  OUTPUT: 'output' // 输出参数
} as const

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
  ],
  'property.dataSpecs.length': [
    { required: true, message: '请输入文本字节长度', trigger: 'blur' },
    {
      validator: (_: any, value: any, callback: any) => {
        if (isEmpty(value)) {
          callback(new Error('文本长度不能为空'))
          return
        }
        if (isNaN(Number(value))) {
          callback(new Error('文本长度必须是数字'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  'property.accessMode': [{ required: true, message: '请选择读写类型', trigger: 'change' }]
}

/** 校验布尔值名称 */
export const validateBoolName = (_: any, value: string, callback: any) => {
  if (isEmpty(value)) {
    callback(new Error('布尔值名称不能为空'))
    return
  }
  // 检查开头字符
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9]/.test(value)) {
    callback(new Error('布尔值名称必须以中文、英文字母或数字开头'))
    return
  }
  // 检查整体格式
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9][a-zA-Z0-9\u4e00-\u9fa5_-]*$/.test(value)) {
    callback(new Error('布尔值名称只能包含中文、英文字母、数字、下划线和短划线'))
    return
  }
  // 检查长度（一个中文算一个字符）
  if (value.length > 20) {
    callback(new Error('布尔值名称长度不能超过 20 个字符'))
    return
  }

  callback()
}
