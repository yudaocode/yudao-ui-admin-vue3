import axios, { CanceledError } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

/**
 * request 封装的请求取消能力（参考上游 32381408b 的 cancelRequest / cancelAllRequest，按芋道 service 适配）
 *
 * 只登记通过 request 封装发起、且调用方没有自行传入 signal / cancelToken 的请求；
 * 调用方自管的取消方式保持原样，不登记、不受 cancelRequest / cancelAllRequest 影响。
 * 不做自动取消或去重：同一 url 并发的多个请求各自登记，按 url 取消时一并取消。
 */

// 原始 url（调用方传入的 option.url，未拼接 baseURL / params）-> 进行中请求的控制器
const pendingRequests = new Map<string, Set<AbortController>>()
// 本能力创建的 signal，用于识别"被本能力主动取消"的错误
const managedSignals = new WeakSet<AbortSignal>()

/** 调用方是否自行管理取消（传入了 signal 或 cancelToken） */
export const hasCallerCancellation = (option: Recordable): boolean => {
  return option?.signal != null || option?.cancelToken != null
}

/**
 * 登记并发起一个可取消请求，返回的 Promise 与 send 的结果一致。
 * 取消时立即以 axios CanceledError 拒绝（axios.isCancel 判定为 true），不等待 401 刷新令牌、队列回放结束；
 * signal 已中止，之后的刷新回放在 axios 发送前即被拒绝，不会再发出原请求。
 * 无论成功、失败或取消，结束后都会注销登记并移除监听。
 */
export const runCancellableRequest = <T>(
  url: unknown,
  send: (signal: AbortSignal) => Promise<T>
): Promise<T> => {
  // url 为空（未传、空字符串、非字符串）时登记在 '' 下：不能按 url 取消，仅 cancelAllRequest 生效
  const key = typeof url === 'string' ? url : ''
  const controller = new AbortController()
  const { signal } = controller
  managedSignals.add(signal)
  let controllers = pendingRequests.get(key)
  if (!controllers) {
    controllers = new Set()
    pendingRequests.set(key, controllers)
  }
  controllers.add(controller)

  let onAbort: () => void = () => {}
  const canceled = new Promise<never>((_, reject) => {
    onAbort = () => reject(new CanceledError())
    signal.addEventListener('abort', onAbort, { once: true })
  })
  let sending: Promise<T>
  try {
    sending = send(signal)
  } catch (error) {
    // 请求构建阶段的同步异常同样走清理流程
    sending = Promise.reject(error)
  }
  // race 同时订阅两个 Promise，落败一方之后的拒绝也已被处理，不会产生 unhandled rejection
  return Promise.race([sending, canceled]).finally(() => {
    signal.removeEventListener('abort', onAbort)
    const current = pendingRequests.get(key)
    if (current) {
      current.delete(controller)
      if (current.size === 0) pendingRequests.delete(key)
    }
  })
}

/** 中止指定 url 下所有进行中的登记请求；空 url 忽略，已结束的请求不再登记，重复取消无副作用 */
export const cancelRequest = (url: string | string[]) => {
  const urls = Array.isArray(url) ? url : [url]
  for (const key of urls) {
    if (typeof key !== 'string' || key === '') continue
    const controllers = pendingRequests.get(key)
    if (!controllers) continue
    for (const controller of [...controllers]) controller.abort()
  }
}

/** 中止全部进行中的登记请求（含未传 url 的请求） */
export const cancelAllRequest = () => {
  for (const controllers of [...pendingRequests.values()]) {
    for (const controller of [...controllers]) controller.abort()
  }
}

/** 在异步响应处理继续后复核自己的取消状态，避免已取消的请求继续弹出业务错误提示 */
export const throwIfRequestCanceled = (config: InternalAxiosRequestConfig) => {
  const signal = config.signal as AbortSignal | undefined
  if (signal?.aborted && managedSignals.has(signal)) {
    const error = new CanceledError()
    error.config = config
    throw error
  }
}

/** 是否为本能力创建、且已被 cancelRequest / cancelAllRequest 中止的请求错误；调用方自管 signal 的取消不在此列 */
export const isCanceledByRequestCancellation = (error: unknown): boolean => {
  if (!axios.isCancel(error)) return false
  const signal = (error as CanceledError<unknown>).config?.signal
  return !!signal && managedSignals.has(signal as AbortSignal) && !!signal.aborted
}
