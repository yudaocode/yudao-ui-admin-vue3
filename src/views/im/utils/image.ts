// ====================================================================
// IM 图片工具
// ====================================================================
// - probeImageSize：加载本地 File 或远程 URL，读出 naturalWidth / naturalHeight
// - loadImage：加载远程 URL 到 HTMLImageElement（失败返回 null，不抛错），供 canvas 绘制使用
// ====================================================================

/** 默认占位尺寸：probe 失败 / 解码异常时兜底，避免 width/height 为 0 让消息渲染塌掉 */
const DEFAULT_FALLBACK_SIZE = { width: 200, height: 200 } as const

/** 加载远程 URL 到 HTMLImageElement，失败返回 null；canvas 绘制要求 crossOrigin=anonymous（默认开） */
export function loadImage(
  src: string,
  options: { crossOrigin?: 'anonymous' | 'use-credentials' | null } = {}
): Promise<HTMLImageElement | null> {
  const crossOrigin = options.crossOrigin === undefined ? 'anonymous' : options.crossOrigin
  return new Promise((resolve) => {
    const img = new Image()
    if (crossOrigin) {
      img.crossOrigin = crossOrigin
    }
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/**
 * 加载本地 File 或远程 URL，解出 naturalWidth / naturalHeight
 *
 * - File：内部 createObjectURL + revokeObjectURL，避免内存累积
 * - 远程 URL：直接走 <img>.src 触发浏览器加载（受 CORS 影响；只读尺寸不需要画 canvas，跨域也能拿到）
 * - 解码失败 / 不是图片：返回 200×200 兜底
 */
export function probeImageSize(source: File | string): Promise<{ width: number; height: number }> {
  const isFile = source instanceof File
  const src = isFile ? URL.createObjectURL(source) : source
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      if (isFile) {
        URL.revokeObjectURL(src)
      }
      resolve({
        width: img.naturalWidth || DEFAULT_FALLBACK_SIZE.width,
        height: img.naturalHeight || DEFAULT_FALLBACK_SIZE.height
      })
    }
    img.onerror = () => {
      if (isFile) {
        URL.revokeObjectURL(src)
      }
      resolve({ ...DEFAULT_FALLBACK_SIZE })
    }
    img.src = src
  })
}
