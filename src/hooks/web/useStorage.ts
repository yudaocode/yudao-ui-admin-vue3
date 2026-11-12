// 获取传入的值的类型（参考上游 879358821d）：如 String、Number、Boolean、Array、Object、Null
const getValueType = (value: any) => {
  const type = Object.prototype.toString.call(value)
  return type.slice(8, -1)
}

// 是否为 setStorage 写入的 { type, value } 结构：普通对象，自身键只有 type（及 value），type 为类型名
const isTypedValue = (data: unknown): data is { type: string; value?: any } => {
  if (getValueType(data) !== 'Object') return false
  const keys = Object.keys(data as object)
  return (
    keys.includes('type') &&
    keys.every((key) => key === 'type' || key === 'value') &&
    typeof (data as Recordable).type === 'string' &&
    /^[A-Z]\w*$/.test((data as Recordable).type)
  )
}

/**
 * 浏览器 Storage 读写（参考上游 dfea91c7e1、879358821d）：默认 sessionStorage，可选 localStorage。
 * 写入统一为 JSON 字符串 { type, value }，读取时还原 value，字符串 '123' / 'true' 不会变成数值 / 布尔；
 * value 按 JSON 序列化，Date 读回为字符串，undefined 读回 undefined，不做额外类型转换。
 * 兼容旧写入：非 { type, value } 结构时按 JSON 解析（旧对象 / 数组 / 数值），解析失败返回原字符串，缺失键返回 null；
 * 旧数据本身恰好是只含 type（及 value）且 type 为大写开头类型名的对象时，无法与新格式区分，会按新格式读取。
 * 与 useCache 并存，不替换已有缓存调用；只在调用方法时访问 window[type]
 */
export const useStorage = (type: 'sessionStorage' | 'localStorage' = 'sessionStorage') => {
  const setStorage = (key: string, value: any) => {
    const valueType = getValueType(value)
    window[type].setItem(key, JSON.stringify({ type: valueType, value }))
  }

  const getStorage = (key: string) => {
    const value = window[type].getItem(key)
    if (value === null) return null
    try {
      const data = JSON.parse(value)
      return isTypedValue(data) ? data.value : data
    } catch (error) {
      return value
    }
  }

  const removeStorage = (key: string) => {
    window[type].removeItem(key)
  }

  /**
   * 清空当前所选 storage：不传或传空数组时清空全部键（与 Storage.clear 一致，不限于本 hook 写入的键）；
   * 传 excludes 时保留其中的键，其余键全部移除
   */
  const clear = (excludes?: string[]) => {
    const storage = window[type]
    if (!excludes?.length) {
      storage.clear()
      return
    }
    const keys: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key !== null && !excludes.includes(key)) keys.push(key)
    }
    keys.forEach((key) => storage.removeItem(key))
  }

  return {
    setStorage,
    getStorage,
    removeStorage,
    clear
  }
}
