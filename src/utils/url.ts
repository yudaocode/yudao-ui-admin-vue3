const OPENABLE_PROTOCOLS = new Set(['http:', 'https:', 'blob:'])

/** 判断 URL 是否允许在新窗口打开 */
export function isOpenableUrl(url?: string | null): boolean {
  if (!url) {
    return false
  }
  try {
    const parsed = new URL(url, window.location.origin)
    return OPENABLE_PROTOCOLS.has(parsed.protocol)
  } catch {
    return false
  }
}

/** 安全打开 URL */
export function openSafeUrl(url?: string | null): void {
  if (!url || !isOpenableUrl(url)) {
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
