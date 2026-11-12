import { getCurrentScope, onScopeDispose, ref, unref } from 'vue'

export interface ScrollToParams {
  el: HTMLElement
  to: number
  position: string
  duration?: number
  callback?: () => void
}

const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
  t /= d / 2
  if (t < 1) {
    return (c / 2) * t * t + b
  }
  t--
  return (-c / 2) * (t * (t - 2) - 1) + b
}
const move = (el: HTMLElement, position: string, amount: number) => {
  el[position] = amount
}

export function useScrollTo({
  el,
  position = 'scrollLeft',
  to,
  duration = 500,
  callback
}: ScrollToParams) {
  const isActiveRef = ref(false)
  // 每帧推进 20ms，节奏与缓动不变
  const increment = 20
  let start = 0
  let change = 0
  let currentTime = 0
  // 同一时刻只保留一个待执行的动画帧
  let frameId: number | undefined

  function cancelFrame() {
    if (frameId !== undefined) {
      cancelAnimationFrame(frameId)
      frameId = undefined
    }
  }

  // 完成：精确落在 to，先结束状态再回调，回调内可再次 start
  function finish() {
    move(el, position, to)
    isActiveRef.value = false
    if (callback) {
      callback()
    }
  }

  function animateScroll() {
    frameId = undefined
    if (!unref(isActiveRef)) {
      return
    }
    currentTime += increment
    if (currentTime >= duration) {
      finish()
      return
    }
    move(el, position, easeInOutQuad(currentTime, start, change, duration))
    frameId = requestAnimationFrame(animateScroll)
  }

  // 开始：取消上一轮动画，从当前位置重新计算并重置进度；duration <= 0 时直接完成
  function run() {
    cancelFrame()
    start = el[position]
    change = to - start
    currentTime = 0
    isActiveRef.value = true
    if (duration <= 0) {
      finish()
      return
    }
    animateScroll()
  }

  function stop() {
    cancelFrame()
    isActiveRef.value = false
  }

  // 在组件 / effectScope 内使用时，销毁时停止动画；作用域外调用不受影响
  if (getCurrentScope()) {
    onScopeDispose(stop)
  }

  return { start: run, stop }
}
