/** 从 URL 中提取文件名 */
export const getFileNameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const fileName = pathname.split('/').pop() || 'unknown'
    return decodeURIComponent(fileName)
  } catch {
    // 如果 URL 解析失败，尝试从字符串中提取
    const cleanUrl = url.split(/[?#]/)[0]
    const parts = cleanUrl.split('/')
    const fileName = parts[parts.length - 1] || 'unknown'
    try {
      return decodeURIComponent(fileName)
    } catch {
      return fileName
    }
  }
}

/** 获取文件扩展名 */
export const getFileExtension = (filename: string): string => {
  const cleanName = filename.split(/[?#]/)[0]
  return cleanName.split('.').pop()?.toLowerCase() || ''
}

/** 判断是否为图片 */
export const isImage = (filename: string): boolean => {
  const ext = getFileExtension(filename)
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
  const ext = getFileExtension(filename)
  if (isImage(ext)) {
    return 'ep:picture'
  }
  return 'ep:document'
}

/** 规范化为以 / 开头的 Web 文件路径 */
export const normalizeFilePath = (path?: string): string => {
  let normalizedPath = (path || '/').trim().replaceAll('\\', '/')
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath
  }
  while (normalizedPath.includes('//')) {
    normalizedPath = normalizedPath.replaceAll('//', '/')
  }
  if (normalizedPath.length > 1) {
    normalizedPath = normalizedPath.replace(/\/$/, '')
  }
  return normalizedPath || '/'
}

const ACCEPT_EXTENSION_REGEX = /^\.[^./\\]+(\.[^./\\]+)*$/ // accept 扩展名项，如 .pdf、.tar.gz
const ACCEPT_MIME_REGEX = /^[\w.+-]+\/(\*|[\w.+-]+)$/ // accept MIME 项，如 image/png、image/*

/**
 * 判断文件是否符合 accept 配置
 *
 * 支持扩展名（.pdf）、MIME（image/png）、MIME 通配（image/*）和逗号分隔的多项，任一项匹配即通过，均不区分大小写；
 * 与浏览器 accept 一致，忽略无效项，为空、全部无效或包含 *\/* 时不限制
 */
export const isAcceptedFile = (file: File, accept?: string): boolean => {
  const items = (accept || '').split(',').map((item) => item.trim().toLowerCase())
  if (items.includes('*/*')) {
    return true
  }
  const rules = items.filter(
    (rule) => ACCEPT_EXTENSION_REGEX.test(rule) || ACCEPT_MIME_REGEX.test(rule)
  )
  if (rules.length === 0) {
    return true
  }
  const name = (file.name || '').toLowerCase()
  const type = (file.type || '').toLowerCase()
  return rules.some((rule) => {
    if (rule.startsWith('.')) {
      return name.endsWith(rule)
    }
    if (rule.endsWith('/*')) {
      return type.startsWith(rule.slice(0, -1))
    }
    return type === rule
  })
}
