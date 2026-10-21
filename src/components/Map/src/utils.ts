/**
 * 百度地图 SDK 加载工具
 */

// 扩展 Window 接口以包含百度地图 GL API
declare global {
  interface Window {
    BMapGL: any
  }
}

// 全局回调名称
const CALLBACK_NAME = '__BAIDU_MAP_LOAD_CALLBACK__'

// SDK 加载状态
let loadPromise: Promise<void> | null = null

/**
 * 加载百度地图 GL SDK
 * @param timeout 超时时间（毫秒），默认 10000
 * @returns Promise<void>
 */
export const loadBaiduMapSdk = (timeout = 10000): Promise<void> => {
  // 已加载完成
  if (window.BMapGL) {
    return Promise.resolve()
  }

  // 正在加载中，返回同一个 Promise
  if (loadPromise) {
    return loadPromise
  }

  loadPromise = new Promise((resolve, reject) => {
    // 创建 script 标签
    const script = document.createElement('script')

    // 只清理本次加载的监听和回调，避免旧 script 的回调或错误干扰后续重试
    const cleanup = () => {
      clearTimeout(timeoutId)
      script.onerror = null
      if ((window as any)[CALLBACK_NAME] === handleLoad) {
        delete (window as any)[CALLBACK_NAME]
      }
    }
    const fail = (message: string) => {
      cleanup()
      script.remove()
      loadPromise = null
      reject(new Error(message))
    }
    const handleLoad = () => {
      cleanup()
      resolve()
    }

    const timeoutId = setTimeout(() => fail('百度地图 SDK 加载超时'), timeout)

    // 全局回调
    ;(window as any)[CALLBACK_NAME] = handleLoad

    script.src = `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=${
      import.meta.env.VITE_BAIDU_MAP_KEY
    }&callback=${CALLBACK_NAME}`
    script.onerror = () => fail('百度地图 SDK 加载失败')
    document.body.appendChild(script)
  })

  return loadPromise
}
