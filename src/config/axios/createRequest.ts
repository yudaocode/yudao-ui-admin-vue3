/**
 * 与 UI 无关的通用 Axios 请求工厂
 *
 * 可选模块：只依赖 axios，不引入 Vue / store / router / Element Plus；未被导入时不进入构建产物。
 * 请直接从 '@/config/axios/createRequest' 导入，它不经 '@/config/axios' 再导出。
 *
 * 与默认请求（'@/config/axios'）的区别：
 * 1. 不接入芋道的认证、租户、加解密、刷新令牌、业务码与消息提示；需要时由使用方通过 beforeRequest /
 *    transformResponse / onError 自行提供。
 * 2. 默认返回 response.data，而不是默认请求解包后的 data.data。
 * 3. 实例由 axios.create 创建，按 Axios 标准会继承创建时 axios.defaults 中的配置（含 headers.common），
 *    不保证与全局 headers 隔离。
 * 4. 取消登记按实例独立：本实例的 cancelRequest / cancelAllRequest 与默认请求互不影响。
 *    调用方传入的 signal 会联动到本实例内部的 AbortController（仅限本实例，与默认请求的约定无关）。
 *
 * 等待 beforeRequest 期间也可取消，取消后立即拒绝且不发送请求。
 * 等待期间按原始 config 的取消键登记、跟随原始 signal；发送前再按 beforeRequest 返回的 config 重新登记。
 * 配置 beforeRequest 时 getRequestKey 会对原始与返回的 config 各调用一次，应为纯函数。
 */
import axios, {
  CanceledError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type CreateAxiosDefaults
} from 'axios'

type MaybePromise<Value> = Value | Promise<Value>

// 等待 value 完成；期间 signal 中止则立即以 CanceledError 拒绝，不再等待 value，其后的结果或异常被忽略
// （与默认请求 requestCancellation 的“取消即拒绝”一致）
const untilAborted = <Value>(value: MaybePromise<Value>, signal: AbortSignal) =>
  new Promise<Value>((resolve, reject) => {
    const onAbort = () => reject(new CanceledError())
    if (signal.aborted) onAbort()
    else signal.addEventListener('abort', onAbort, { once: true })
    Promise.resolve(value)
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', onAbort))
  })

export interface RequestConfig<Data = unknown> extends AxiosRequestConfig<Data> {
  /** 取消登记的键，只用于 cancelRequest，发送前移除，不会传给 axios */
  requestKey?: string
}

export interface CreateRequestOptions {
  axiosConfig?: CreateAxiosDefaults
  beforeRequest?: <Data>(config: RequestConfig<Data>) => MaybePromise<RequestConfig<Data>>
  transformResponse?: (response: AxiosResponse) => MaybePromise<unknown>
  /** 请求前置、发送、响应转换中的错误都会经过这里（包括取消，可用 isCancel 区分），之后原样抛出 */
  onError?: (error: unknown) => MaybePromise<void>
  /** 未传 requestKey 时生成取消键；默认不设置，取消键回退为 url。返回空串时只能被 cancelAllRequest 取消 */
  getRequestKey?: <Data>(config: RequestConfig<Data>) => string
}

export interface RequestClient {
  instance: AxiosInstance
  request: <Response = unknown, Data = unknown>(config: RequestConfig<Data>) => Promise<Response>
  get: <Response = unknown>(config: RequestConfig) => Promise<Response>
  post: <Response = unknown, Data = unknown>(config: RequestConfig<Data>) => Promise<Response>
  put: <Response = unknown, Data = unknown>(config: RequestConfig<Data>) => Promise<Response>
  delete: <Response = unknown, Data = unknown>(config: RequestConfig<Data>) => Promise<Response>
  cancelRequest: (key: string | readonly string[]) => void
  cancelAllRequest: () => void
}

export const createRequest = (options: CreateRequestOptions = {}): RequestClient => {
  const instance = axios.create(options.axiosConfig)
  const controllers = new Set<AbortController>()
  const controllersByKey = new Map<string, Set<AbortController>>()

  const track = (controller: AbortController, key: string) => {
    controllers.add(controller)
    if (!key) return
    const keyedControllers = controllersByKey.get(key) ?? new Set<AbortController>()
    keyedControllers.add(controller)
    controllersByKey.set(key, keyedControllers)
  }

  const untrack = (controller: AbortController, key: string) => {
    controllers.delete(controller)
    if (!key) return
    const keyedControllers = controllersByKey.get(key)
    keyedControllers?.delete(controller)
    if (keyedControllers?.size === 0) controllersByKey.delete(key)
  }

  // 取消键优先级：requestKey > getRequestKey(config) > url > ''
  const resolveKey = <Data>(config: RequestConfig<Data>) =>
    config.requestKey ?? options.getRequestKey?.(config) ?? config.url ?? ''

  const request = async <Response = unknown, Data = unknown>(
    config: RequestConfig<Data>
  ): Promise<Response> => {
    const controller = new AbortController()
    let key = ''
    let externalSignal: AbortSignal | undefined
    let unfollow = () => {}

    // 把内部 controller 登记到取消键，并让它跟随调用方的 signal：已中止则立即中止，否则在其中止时跟随中止。
    // 再次调用时先解除上一次的登记；signal 未变化时沿用原监听，变化时改为跟随新的 signal
    const bind = (nextKey: string, nextSignal: AbortSignal | undefined) => {
      untrack(controller, key)
      track(controller, nextKey)
      key = nextKey
      if (nextSignal === externalSignal) return
      unfollow()
      externalSignal = nextSignal
      unfollow = () => {}
      if (!nextSignal) return
      const abort = () => controller.abort(nextSignal.reason)
      if (nextSignal.aborted) {
        abort()
        return
      }
      nextSignal.addEventListener('abort', abort, { once: true })
      unfollow = () => nextSignal.removeEventListener('abort', abort)
    }
    const release = () => {
      unfollow()
      untrack(controller, key)
    }

    let prepared: RequestConfig<Data> = config
    if (options.beforeRequest) {
      // 等待 beforeRequest 期间也登记，否则期间的取消会被漏掉、请求仍会发出：
      // 等待期间按原始 config 解析的键登记并跟随原始 signal，cancelRequest(该键) / cancelAllRequest / signal 中止
      // 会立即以 CanceledError 拒绝且不再发送；beforeRequest 只调用一次，取消后其结果或异常被忽略
      bind(resolveKey(config), config.signal as AbortSignal | undefined)
      try {
        prepared = await untilAborted(options.beforeRequest(config), controller.signal)
      } catch (error) {
        release()
        await options.onError?.(error)
        throw error
      }
    }

    // 发送阶段按 beforeRequest 返回的 config 重新解析取消键、跟随其 signal
    try {
      bind(resolveKey(prepared), prepared.signal as AbortSignal | undefined)
    } catch (error) {
      release()
      throw error
    }

    const axiosConfig = { ...prepared }
    delete axiosConfig.requestKey
    try {
      const response = await instance.request({ ...axiosConfig, signal: controller.signal })
      return (
        options.transformResponse ? await options.transformResponse(response) : response.data
      ) as Response
    } catch (error) {
      await options.onError?.(error)
      throw error
    } finally {
      release()
    }
  }

  const cancelRequest = (key: string | readonly string[]) => {
    const keys = Array.isArray(key) ? key : [key]
    keys.forEach((item) => {
      controllersByKey.get(item)?.forEach((controller) => controller.abort())
      controllersByKey.delete(item)
    })
  }

  const cancelAllRequest = () => {
    controllers.forEach((controller) => controller.abort())
    controllers.clear()
    controllersByKey.clear()
  }

  return {
    instance,
    request,
    get: (config) => request({ ...config, method: 'get' }),
    post: (config) => request({ ...config, method: 'post' }),
    put: (config) => request({ ...config, method: 'put' }),
    delete: (config) => request({ ...config, method: 'delete' }),
    cancelRequest,
    cancelAllRequest
  }
}

export type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  RawAxiosRequestHeaders
} from 'axios'
export { isCancel } from 'axios'
