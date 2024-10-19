export interface BaseResponse<T> {
  code: number // 0表示成功其他表示失败
  message: string // 返回的信息，可以是成功或错误信息
  data: T // 泛型数据，成功时返回数据，失败时为 null
}
