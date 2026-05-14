import { ref, watch, type Ref } from 'vue'

/**
 * 把响应式 MediaStream 挂到 `<video>` / `<audio>` 元素的 srcObject 上；
 * stream 为空时清掉 srcObject，避免设备关闭后画面卡在最后一帧
 */
export function useMediaStreamElement<T extends HTMLMediaElement>(
  streamSource: () => MediaStream | null | undefined
): Ref<T | undefined> {
  const elRef = ref<T>()
  watch(
    streamSource,
    (stream) => {
      if (elRef.value) {
        elRef.value.srcObject = stream || null
      }
    },
    { flush: 'post', immediate: true }
  )
  return elRef
}
