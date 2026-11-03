import { getCurrentScope, onScopeDispose, ref } from 'vue'

// 与上游 @/hooks/web/useClipboard 同名同返回结构：copy / text / copied / isSupported
// 只有真正写入成功才更新 text、copied；业务页面原有的 @vueuse/core useClipboard 不受影响

interface UseClipboardOptions {
  // 复制成功后 copied 保持为 true 的毫秒数
  copiedDuring?: number
}

const hasClipboardApi = (): boolean => {
  return typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function'
}

const hasLegacyCopy = (): boolean => {
  return typeof document !== 'undefined' && typeof document.execCommand === 'function'
}

// 优先使用 Clipboard API，拒绝或异常时返回 false
const writeByClipboardApi = async (value: string): Promise<boolean> => {
  if (!hasClipboardApi()) return false
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

// 非安全上下文（如内网 http）兜底：临时 textarea + execCommand，以其返回值判断是否成功
const writeByExecCommand = (value: string): boolean => {
  if (!hasLegacyCopy() || !document.body) return false
  // 记录原焦点与选区，复制后恢复
  const activeElement = document.activeElement as HTMLElement | null
  const selection = document.getSelection()
  const ranges: Range[] = []
  if (selection) {
    for (let i = 0; i < selection.rangeCount; i++) {
      ranges.push(selection.getRangeAt(i))
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.setAttribute('aria-hidden', 'true')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  try {
    document.body.appendChild(textarea)
    textarea.select()
    return document.execCommand('copy') === true
  } catch {
    return false
  } finally {
    textarea.remove()
    if (selection) {
      selection.removeAllRanges()
      ranges.forEach((range) => selection.addRange(range))
    }
    if (activeElement && activeElement !== document.body && document.contains(activeElement)) {
      activeElement.focus?.({ preventScroll: true })
    }
  }
}

const useClipboard = (options: UseClipboardOptions = {}) => {
  const { copiedDuring = 1500 } = options

  const text = ref('')
  const copied = ref(false)
  const isSupported = ref(hasClipboardApi() || hasLegacyCopy())

  let timer: ReturnType<typeof setTimeout> | undefined
  // 连续复制时，只让最后一次调用更新状态
  let copyId = 0

  const clearTimer = () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  const copy = async (value: string): Promise<boolean> => {
    const id = ++copyId
    const str = String(value ?? '')
    let success = await writeByClipboardApi(str)
    // 失效的异步请求不能再启动一次新的旧版复制；已发出的系统 Clipboard API 无法撤回。
    if (id !== copyId) return success
    if (!success) success = writeByExecCommand(str)
    if (id !== copyId) return success

    clearTimer()
    if (!success) {
      copied.value = false
      return false
    }
    text.value = str
    copied.value = true
    timer = setTimeout(() => {
      copied.value = false
      timer = undefined
    }, copiedDuring)
    return true
  }

  // 组件卸载 / effect scope 销毁时清理计时器，并让未完成的复制不再更新状态
  if (getCurrentScope()) {
    onScopeDispose(() => {
      copyId++
      clearTimer()
    })
  }

  return { copy, text, copied, isSupported }
}

export { useClipboard }
