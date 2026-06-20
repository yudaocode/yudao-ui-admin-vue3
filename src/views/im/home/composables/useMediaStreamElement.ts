import { watch, type VNodeRef } from 'vue'

/**
 * 把响应式 MediaStream 挂到 `<video>` / `<audio>` 元素的 srcObject 上；
 * stream 为空时清掉 srcObject，避免设备关闭后画面卡在最后一帧
 */
export function useMediaStreamElement<T extends HTMLMediaElement>(
  streamSource: () => MediaStream | null | undefined
): VNodeRef {
  let el: T | null = null
  let currentStream: MediaStream | null | undefined

  const syncStream = () => {
    if (el) {
      el.srcObject = currentStream || null
    }
  }

  watch(
    streamSource,
    (stream) => {
      currentStream = stream
      syncStream()
    },
    { flush: 'post', immediate: true }
  )

  return (value) => {
    if (value instanceof HTMLMediaElement) {
      el = value as T
      syncStream()
      return
    }
    if (el) {
      el.srcObject = null
    }
    el = null
  }
}
