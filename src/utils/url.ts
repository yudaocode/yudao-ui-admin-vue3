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

/**
 * 在新窗口打开异步获取的地址：点击时同步打开空白窗口，避免浏览器拦截异步弹窗；
 * 获取失败或地址不允许打开时关闭该窗口
 */
export async function openAsyncUrlWindow(getUrl: () => Promise<string>): Promise<void> {
  const newWindow = window.open('', '_blank')
  try {
    const url = await getUrl()
    if (!isOpenableUrl(url)) {
      newWindow?.close()
      return
    }
    if (!newWindow) {
      openSafeUrl(url)
      return
    }
    newWindow.opener = null
    newWindow.location.href = url
  } catch (error) {
    newWindow?.close()
    throw error
  }
}
