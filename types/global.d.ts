export {}
declare global {
  interface Fn<T = any> {
    (...arg: T[]): T
  }

  type Nullable<T> = T | null

  type ElRef<T extends HTMLElement = HTMLDivElement> = Nullable<T>

  type Recordable<T = any, K = string> = Record<K extends null | undefined ? string : K, T>

  type ComponentRef<T> = InstanceType<T>

  type LocaleType = 'zh-CN' | 'en'

  declare type TimeoutHandle = ReturnType<typeof setTimeout>
  declare type IntervalHandle = ReturnType<typeof setInterval>

  type AxiosHeaders =
    | 'application/json'
    | 'application/x-www-form-urlencoded'
    | 'multipart/form-data'

  type AxiosMethod = 'get' | 'post' | 'delete' | 'put' | 'GET' | 'POST' | 'DELETE' | 'PUT'

  type AxiosResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'

  interface AxiosConfig {
    params?: any
    data?: any
    url?: string
    method?: AxiosMethod
    headersType?: string
    responseType?: AxiosResponseType
  }

  interface IResponse<T = any> {
    code: string
    data: T extends any ? T : T & any
  }

  interface PageParam {
    pageSize?: number
    pageNo?: number
  }

  interface Tree {
    id: number
    name: string
    children?: Tree[] | any[]
  }
  // 分页数据公共返回
  interface PageResult<T> {
    list: T // 数据
    total: number // 总量
  }
}
