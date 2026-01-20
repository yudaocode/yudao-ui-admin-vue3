/** 从 URL 中提取文件名 */
export const getFileNameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const fileName = pathname.split('/').pop() || 'unknown'
    return decodeURIComponent(fileName)
  } catch {
    // 如果 URL 解析失败，尝试从字符串中提取
    const parts = url.split('/')
    return parts[parts.length - 1] || 'unknown'
  }
}

/** 判断是否为图片 */
export const isImage = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)
}

/** 格式化文件大小 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/** 获取文件图标 */
export const getFileIcon = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (isImage(ext)) {
    return 'ep:picture'
  }
  return 'ep:document'
}
