// ====================================================================
// IM 图片探针 utility
// ====================================================================
// 加载本地 File 或远程 URL，读出 naturalWidth / naturalHeight
// ====================================================================

/** 默认占位尺寸：probe 失败 / 解码异常时兜底，避免 width/height 为 0 让消息渲染塌掉 */
const DEFAULT_FALLBACK_SIZE = { width: 200, height: 200 } as const

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
