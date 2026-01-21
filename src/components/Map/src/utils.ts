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
    const timeoutId = setTimeout(() => {
      loadPromise = null
      reject(new Error('百度地图 SDK 加载超时'))
    }, timeout)

    // 全局回调
    ;(window as any)[CALLBACK_NAME] = () => {
      clearTimeout(timeoutId)
      delete (window as any)[CALLBACK_NAME]
      resolve()
    }

    // 创建 script 标签
    const script = document.createElement('script')
    script.src = `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=${
      import.meta.env.VITE_BAIDU_MAP_KEY
    }&callback=${CALLBACK_NAME}`
    script.onerror = () => {
      clearTimeout(timeoutId)
      loadPromise = null
      delete (window as any)[CALLBACK_NAME]
      reject(new Error('百度地图 SDK 加载失败'))
    }
    document.body.appendChild(script)
  })

  return loadPromise
}
