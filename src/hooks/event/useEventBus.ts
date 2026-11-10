import { getCurrentScope, onScopeDispose } from 'vue'
import { useEmitt } from '@/hooks/web/useEmitt'

interface Option {
  name: string // 事件名称
  callback: Fn // 回调
}

/**
 * 事件总线（与上游 useEventBus 写法一致）
 * 与 useEmitt 共用同一个 mitt 实例，两种写法注册/触发的事件互通
 */
export const useEventBus = (option?: Option) => {
  const { emitter } = useEmitt()

  if (option) {
    emitter.on(option.name, option.callback)

    // 组件卸载或 effectScope 停止时只移除本次注册的回调，不影响其他组件对同名事件的监听
    if (getCurrentScope()) {
      onScopeDispose(() => {
        emitter.off(option.name, option.callback)
      })
    }
  }

  return {
    on: emitter.on,
    off: emitter.off,
    emit: emitter.emit,
    all: emitter.all
  }
}
