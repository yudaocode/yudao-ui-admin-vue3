// ====================================================================
// IM 图片本地探针 utility
// ====================================================================
// 仅做「读 File 的宽高」一类纯前端 probe；不涉及上传 / 网络
// ====================================================================

/** 默认占位尺寸：probe 失败 / 解码异常时兜底，避免 width/height 为 0 让消息渲染塌掉 */
const DEFAULT_FALLBACK_SIZE = { width: 200, height: 200 } as const

/**
 * 加载本地图片 File，解出 naturalWidth / naturalHeight
 *
 * - 成功：返回真实尺寸
 * - 解码失败 / 不是图片：返回 200×200 兜底；调用方按 nullable 看待数值
 * - 内部 revokeObjectURL 释放 blob URL，避免内存累积
 */
export function probeImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({
        width: img.naturalWidth || DEFAULT_FALLBACK_SIZE.width,
        height: img.naturalHeight || DEFAULT_FALLBACK_SIZE.height
      })
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({ ...DEFAULT_FALLBACK_SIZE })
    }
    img.src = objectUrl
  })
}
