import { service } from './service'

import { config } from './config'
import {
  cancelAllRequest,
  cancelRequest,
  hasCallerCancellation,
  runCancellableRequest
} from './requestCancellation'

const { default_headers } = config

const request = (option: any) => {
  const { headersType, headers, ...otherOption } = option
  const send = (signal?: AbortSignal) =>
    service({
      ...otherOption,
      ...(signal ? { signal } : {}),
      headers: {
        'Content-Type': headersType || default_headers,
        ...headers
      }
    })
  // 调用方自行传入 signal / cancelToken 时保持原样，不纳入 cancelRequest / cancelAllRequest 管理
  return hasCallerCancellation(option) ? send() : runCancellableRequest(option.url, send)
}
export default {
  get: async <T = any>(option: any) => {
    const res = await request({ method: 'GET', ...option })
    return res.data as unknown as T
  },
  post: async <T = any>(option: any) => {
    const res = await request({ method: 'POST', ...option })
    return res.data as unknown as T
  },
  postOriginal: async (option: any) => {
    const res = await request({ method: 'POST', ...option })
    return res
  },
  delete: async <T = any>(option: any) => {
    const res = await request({ method: 'DELETE', ...option })
    return res.data as unknown as T
  },
  put: async <T = any>(option: any) => {
    const res = await request({ method: 'PUT', ...option })
    return res.data as unknown as T
  },
  download: async <T = any>(option: any) => {
    const res = await request({ method: 'GET', responseType: 'blob', ...option })
    return res as unknown as Promise<T>
  },
  upload: async <T = any>(option: any) => {
    option.headersType = 'multipart/form-data'
    const res = await request({ method: 'POST', ...option })
    return res as unknown as Promise<T>
  },
  /**
   * 取消指定 url（与发起时传入的 url 完全一致，不含 baseURL / params）下所有进行中的请求，同一 url 并发的请求一并取消。
   * 仅作用于通过本封装发起、且未自行传入 signal / cancelToken 的请求；空 url、已结束的请求忽略。
   * 被取消的请求以 axios CanceledError 拒绝（axios.isCancel 为 true），不弹出错误提示；
   * 处于 401 刷新令牌等待中的请求同样立即拒绝，刷新完成后不再重发
   */
  cancelRequest,
  /** 取消全部进行中的请求，范围与 cancelRequest 相同 */
  cancelAllRequest
}
