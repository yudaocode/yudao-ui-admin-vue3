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

/** 地图预览页面加载失败时发给父页面的消息类型 */
export const BAIDU_MAP_PREVIEW_ERROR = 'baidu-map-preview-error'

/**
 * 生成单点地图只读预览页面，作为 iframe 的 srcdoc 使用
 *
 * 页面独立加载 SDK 且从不调用 destroy；iframe 移除或重新导航时，由浏览器回收其中的脚本、定时器、Worker 与 WebGL 上下文
 * @param longitude BD09 经度
 * @param latitude BD09 纬度
 * @param zoom 缩放级别
 * @param timeout SDK 加载超时时间（毫秒），默认 10000
 * @returns 页面 HTML；Key 未配置或参数无效时返回空字符串
 */
export const buildBaiduMapPreviewHtml = (
  longitude: number,
  latitude: number,
  zoom: number,
  timeout = 10000
): string => {
  const key = import.meta.env.VITE_BAIDU_MAP_KEY
  if (!key || ![longitude, latitude, zoom].every((value) => Number.isFinite(value))) {
    return ''
  }
  const sdkUrl = `https://api.map.baidu.com/api?v=1.0&amp;type=webgl&amp;ak=${encodeURIComponent(key)}&amp;callback=initMap`
  return [
    '<!doctype html><html><head><meta charset="utf-8">',
    '<style>html,body,#map{width:100%;height:100%;margin:0;overflow:hidden}</style>',
    '</head><body><div id="map"></div><script>',
    'var loaded = false;',
    `function fail() { if (!loaded) parent.postMessage({ type: '${BAIDU_MAP_PREVIEW_ERROR}' }, '*'); }`,
    'function initMap() {',
    "  var map = new BMapGL.Map('map');",
    '  map.disableDragging();',
    '  map.disableDoubleClickZoom();',
    '  map.disablePinchToZoom();',
    `  var point = new BMapGL.Point(${longitude}, ${latitude});`,
    '  map.addOverlay(new BMapGL.Marker(point));',
    `  map.centerAndZoom(point, ${zoom});`,
    '  loaded = true;',
    '}',
    `setTimeout(fail, ${timeout});`,
    `</script><script src="${sdkUrl}" onerror="fail()"></script>`,
    '</body></html>'
  ].join('\n')
}

/** 地图 iframe 中 SDK 加载完成时发给父页面的消息类型 */
export const BAIDU_MAP_FRAME_READY = 'baidu-map-frame-ready'

/**
 * 生成只加载 SDK 的地图页面，作为 iframe 的 srcdoc 使用
 *
 * 父页面通过 iframe.contentWindow.BMapGL 在页面内的 #map 容器创建地图；SDK 实例、定时器与 Worker 都属于 iframe，移除 iframe 时由浏览器回收
 * @returns 页面 HTML；Key 未配置时返回空字符串
 */
export const buildBaiduMapFrameHtml = (): string => {
  const key = import.meta.env.VITE_BAIDU_MAP_KEY
  if (!key) {
    return ''
  }
  const sdkUrl = `https://api.map.baidu.com/api?v=1.0&amp;type=webgl&amp;ak=${encodeURIComponent(key)}&amp;callback=onSdkReady`
  return [
    '<!doctype html><html><head><meta charset="utf-8">',
    '<style>html,body,#map{width:100%;height:100%;margin:0;overflow:hidden}</style>',
    '</head><body><div id="map"></div><script>',
    `function onSdkReady() { parent.postMessage({ type: '${BAIDU_MAP_FRAME_READY}' }, '*'); }`,
    `</script><script src="${sdkUrl}"></script>`,
    '</body></html>'
  ].join('\n')
}
