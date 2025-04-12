import { toNumber } from 'lodash-es'

/**
 *
 * @param component 需要注册的组件
 * @param alias 组件别名
 * @returns any
 */
export const withInstall = <T>(component: T, alias?: string) => {
  const comp = component as any
  comp.install = (app: any) => {
    app.component(comp.name || comp.displayName, component)
    if (alias) {
      app.config.globalProperties[alias] = component
    }
  }
  return component as T & Plugin
}

/**
 * @param str 需要转下划线的驼峰字符串
 * @returns 字符串下划线
 */
export const humpToUnderline = (str: string): string => {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}

/**
 * @param str 需要转驼峰的下划线字符串
 * @returns 字符串驼峰
 */
export const underlineToHump = (str: string): string => {
  if (!str) return ''
  return str.replace(/\-(\w)/g, (_, letter: string) => {
    return letter.toUpperCase()
  })
}

/**
 * 驼峰转横杠
 */
export const humpToDash = (str: string): string => {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}

export const setCssVar = (prop: string, val: any, dom = document.documentElement) => {
  dom.style.setProperty(prop, val)
}

/**
 * 查找数组对象的某个下标
 * @param {Array} ary 查找的数组
 * @param {Functon} fn 判断的方法
 */
// eslint-disable-next-line
export const findIndex = <T = Recordable>(ary: Array<T>, fn: Fn): number => {
  if (ary.findIndex) {
    return ary.findIndex(fn)
  }
  let index = -1
  ary.some((item: T, i: number, ary: Array<T>) => {
    const ret: T = fn(item, i, ary)
    if (ret) {
      index = i
      return ret
    }
  })
  return index
}

export const trim = (str: string) => {
  return str.replace(/(^\s*)|(\s*$)/g, '')
}

/**
 * @param {Date | number | string} time 需要转换的时间
 * @param {String} fmt 需要转换的格式 如 yyyy-MM-dd、yyyy-MM-dd HH:mm:ss
 */
export function formatTime(time: Date | number | string, fmt: string) {
  if (!time) return ''
  else {
    const date = new Date(time)
    const o = {
      'M+': date.getMonth() + 1,
      'd+': date.getDate(),
      'H+': date.getHours(),
      'm+': date.getMinutes(),
      's+': date.getSeconds(),
      'q+': Math.floor((date.getMonth() + 3) / 3),
      S: date.getMilliseconds()
    }
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
    }
    for (const k in o) {
      if (new RegExp('(' + k + ')').test(fmt)) {
        fmt = fmt.replace(
          RegExp.$1,
          RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
        )
      }
    }
    return fmt
  }
}

/**
 * 生成随机字符串
 */
export function toAnyString() {
  const str: string = 'xxxxx-xxxxx-4xxxx-yxxxx-xxxxx'.replace(/[xy]/g, (c: string) => {
    const r: number = (Math.random() * 16) | 0
    const v: number = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString()
  })
  return str
}

/**
 * 生成指定长度的随机字符串
 *
 * @param length 字符串长度
 */
export function generateRandomStr(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 根据支持的文件类型生成 accept 属性值
 *
 * @param supportedFileTypes 支持的文件类型数组，如 ['PDF', 'DOC', 'DOCX']
 * @returns 用于文件上传组件 accept 属性的字符串
 */
export const generateAcceptedFileTypes = (supportedFileTypes: string[]): string => {
  const allowedExtensions = supportedFileTypes.map((ext) => ext.toLowerCase())
  const mimeTypes: string[] = []

  // 添加常见的 MIME 类型映射
  if (allowedExtensions.includes('txt')) {
    mimeTypes.push('text/plain')
  }
  if (allowedExtensions.includes('pdf')) {
    mimeTypes.push('application/pdf')
  }
  if (allowedExtensions.includes('html') || allowedExtensions.includes('htm')) {
    mimeTypes.push('text/html')
  }
  if (allowedExtensions.includes('csv')) {
    mimeTypes.push('text/csv')
  }
  if (allowedExtensions.includes('xlsx') || allowedExtensions.includes('xls')) {
    mimeTypes.push('application/vnd.ms-excel')
    mimeTypes.push('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  }
  if (allowedExtensions.includes('docx') || allowedExtensions.includes('doc')) {
    mimeTypes.push('application/msword')
    mimeTypes.push('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  }
  if (allowedExtensions.includes('pptx') || allowedExtensions.includes('ppt')) {
    mimeTypes.push('application/vnd.ms-powerpoint')
    mimeTypes.push('application/vnd.openxmlformats-officedocument.presentationml.presentation')
  }
  if (allowedExtensions.includes('xml')) {
    mimeTypes.push('application/xml')
    mimeTypes.push('text/xml')
  }
  if (allowedExtensions.includes('md') || allowedExtensions.includes('markdown')) {
    mimeTypes.push('text/markdown')
  }
  if (allowedExtensions.includes('epub')) {
    mimeTypes.push('application/epub+zip')
  }
  if (allowedExtensions.includes('eml')) {
    mimeTypes.push('message/rfc822')
  }
  if (allowedExtensions.includes('msg')) {
    mimeTypes.push('application/vnd.ms-outlook')
  }

  // 添加文件扩展名
  const extensions = allowedExtensions.map((ext) => `.${ext}`)

  return [...mimeTypes, ...extensions].join(',')
}

/**
 * 首字母大写
 */
export function firstUpperCase(str: string) {
  return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase())
}

export const generateUUID = () => {
  if (typeof crypto === 'object') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    if (typeof crypto.getRandomValues === 'function' && typeof Uint8Array === 'function') {
      const callback = (c: any) => {
        const num = Number(c)
        return (num ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (num / 4)))).toString(
          16
        )
      }
      return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, callback)
    }
  }
  let timestamp = new Date().getTime()
  let performanceNow =
    (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    let random = Math.random() * 16
    if (timestamp > 0) {
      random = (timestamp + random) % 16 | 0
      timestamp = Math.floor(timestamp / 16)
    } else {
      random = (performanceNow + random) % 16 | 0
      performanceNow = Math.floor(performanceNow / 16)
    }
    return (c === 'x' ? random : (random & 0x3) | 0x8).toString(16)
  })
}

/**
 * element plus 的文件大小 Formatter 实现
 *
 * @param row 行数据
 * @param column 字段
 * @param cellValue 字段值
 */
// @ts-ignore
export const fileSizeFormatter = (row, column, cellValue) => {
  const fileSize = cellValue
  const unitArr = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const srcSize = parseFloat(fileSize)
  const index = Math.floor(Math.log(srcSize) / Math.log(1024))
  const size = srcSize / Math.pow(1024, index)
  const sizeStr = size.toFixed(2) //保留的小数位数
  return sizeStr + ' ' + unitArr[index]
}

/**
 * 将值复制到目标对象，且以目标对象属性为准，例：target: {a:1} source:{a:2,b:3} 结果为：{a:2}
 * @param target 目标对象
 * @param source 源对象
 */
export const copyValueToTarget = (target: any, source: any) => {
  const newObj = Object.assign({}, target, source)
  // 删除多余属性
  Object.keys(newObj).forEach((key) => {
    // 如果不是target中的属性则删除
    if (Object.keys(target).indexOf(key) === -1) {
      delete newObj[key]
    }
  })
  // 更新目标对象值
  Object.assign(target, newObj)
}

/**
 * 获取链接的参数值
 * @param key 参数键名
 * @param urlStr 链接地址，默认为当前浏览器的地址
 */
export const getUrlValue = (key: string, urlStr: string = location.href): string => {
  if (!urlStr || !key) return ''
  const url = new URL(decodeURIComponent(urlStr))
  return url.searchParams.get(key) ?? ''
}

/**
 * 获取链接的参数值（值类型）
 * @param key 参数键名
 * @param urlStr 链接地址，默认为当前浏览器的地址
 */
export const getUrlNumberValue = (key: string, urlStr: string = location.href): number => {
  return toNumber(getUrlValue(key, urlStr))
}

/**
 * 构建排序字段
 * @param prop 字段名称
 * @param order 顺序
 */
export const buildSortingField = ({ prop, order }) => {
  return { field: prop, order: order === 'ascending' ? 'asc' : 'desc' }
}

// ========== NumberUtils 数字方法 ==========

/**
 * 数组求和
 *
 * @param values 数字数组
 * @return 求和结果，默认为 0
 */
export const getSumValue = (values: number[]): number => {
  return values.reduce((prev, curr) => {
    const value = Number(curr)
    if (!Number.isNaN(value)) {
      return prev + curr
    } else {
      return prev
    }
  }, 0)
}

// ========== 通用金额方法 ==========

/**
 * 将一个整数转换为分数保留两位小数
 * @param num
 */
export const formatToFraction = (num: number | string | undefined): string => {
  if (typeof num === 'undefined') return '0.00'
  const parsedNumber = typeof num === 'string' ? parseFloat(num) : num
  return (parsedNumber / 100.0).toFixed(2)
}

/**
 * 将一个数转换为 1.00 这样
 * 数据呈现的时候使用
 *
 * @param num 整数
 */
// TODO @芋艿：看看怎么融合掉
export const floatToFixed2 = (num: number | string | undefined): string => {
  let str = '0.00'
  if (typeof num === 'undefined') {
    return str
  }
  const f = formatToFraction(num)
  const decimalPart = f.toString().split('.')[1]
  const len = decimalPart ? decimalPart.length : 0
  switch (len) {
    case 0:
      str = f.toString() + '.00'
      break
    case 1:
      str = f.toString() + '0'
      break
    case 2:
      str = f.toString()
      break
  }
  return str
}

/**
 * 将一个分数转换为整数
 * @param num
 */
// TODO @芋艿：看看怎么融合掉
export const convertToInteger = (num: number | string | undefined): number => {
  if (typeof num === 'undefined') return 0
  const parsedNumber = typeof num === 'string' ? parseFloat(num) : num
  // TODO 分转元后还有小数则四舍五入
  return Math.round(parsedNumber * 100)
}

/**
 * 元转分
 */
export const yuanToFen = (amount: string | number): number => {
  return convertToInteger(amount)
}

/**
 * 分转元
 */
export const fenToYuan = (price: string | number): string => {
  return formatToFraction(price)
}

/**
 * 计算环比
 *
 * @param value 当前数值
 * @param reference 对比数值
 */
export const calculateRelativeRate = (value?: number, reference?: number) => {
  // 防止除0
  if (!reference || reference == 0) return 0

  return ((100 * ((value || 0) - reference)) / reference).toFixed(0)
}

// ========== ERP 专属方法 ==========

const ERP_COUNT_DIGIT = 3
const ERP_PRICE_DIGIT = 2

/**
 * 【ERP】格式化 Input 数字
 *
 * 例如说：库存数量
 *
 * @param num 数量
 * @package digit 保留的小数位数
 * @return 格式化后的数量
 */
export const erpNumberFormatter = (num: number | string | undefined, digit: number) => {
  if (num == null) {
    return ''
  }
  if (typeof num === 'string') {
    num = parseFloat(num)
  }
  // 如果非 number，则直接返回空串
  if (isNaN(num)) {
    return ''
  }
  return num.toFixed(digit)
}

/**
 * 【ERP】格式化数量，保留三位小数
 *
 * 例如说：库存数量
 *
 * @param num 数量
 * @return 格式化后的数量
 */
export const erpCountInputFormatter = (num: number | string | undefined) => {
  return erpNumberFormatter(num, ERP_COUNT_DIGIT)
}

// noinspection JSCommentMatchesSignature
/**
 * 【ERP】格式化数量，保留三位小数
 *
 * @param cellValue 数量
 * @return 格式化后的数量
 */
export const erpCountTableColumnFormatter = (_, __, cellValue: any, ___) => {
  return erpNumberFormatter(cellValue, ERP_COUNT_DIGIT)
}

/**
 * 【ERP】格式化金额，保留二位小数
 *
 * 例如说：库存数量
 *
 * @param num 数量
 * @return 格式化后的数量
 */
export const erpPriceInputFormatter = (num: number | string | undefined) => {
  return erpNumberFormatter(num, ERP_PRICE_DIGIT)
}

// noinspection JSCommentMatchesSignature
/**
 * 【ERP】格式化金额，保留二位小数
 *
 * @param cellValue 数量
 * @return 格式化后的数量
 */
export const erpPriceTableColumnFormatter = (_, __, cellValue: any, ___) => {
  return erpNumberFormatter(cellValue, ERP_PRICE_DIGIT)
}

/**
 * 【ERP】价格计算，四舍五入保留两位小数
 *
 * @param price 价格
 * @param count 数量
 * @return 总价格。如果有任一为空，则返回 undefined
 */
export const erpPriceMultiply = (price: number, count: number) => {
  if (price == null || count == null) {
    return undefined
  }
  return parseFloat((price * count).toFixed(ERP_PRICE_DIGIT))
}

/**
 * 【ERP】百分比计算，四舍五入保留两位小数
 *
 * 如果 total 为 0，则返回 0
 *
 * @param value 当前值
 * @param total 总值
 */
export const erpCalculatePercentage = (value: number, total: number) => {
  if (total === 0) return 0
  return ((value / total) * 100).toFixed(2)
}

/**
 * 适配 echarts map 的地名
 *
 * @param areaName 地区名称
 */
export const areaReplace = (areaName: string) => {
  if (!areaName) {
    return areaName
  }
  return areaName
    .replace('维吾尔自治区', '')
    .replace('壮族自治区', '')
    .replace('回族自治区', '')
    .replace('自治区', '')
    .replace('省', '')
}

/**
 * 解析 JSON 字符串
 *
 * @param str
 */
export function jsonParse(str: string) {
  try {
    return JSON.parse(str)
  } catch (e) {
    console.warn(`str[${str}] 不是一个 JSON 字符串`)
    return str
  }
}

/**
 * 截取字符串
 *
 * @param str 字符串
 * @param start 开始位置
 * @param end 结束位置
 */

export const subString = (str: string, start: number, end: number) => {
  if (str.length > end) {
    return str.slice(start, end)
  }
  return str
}
