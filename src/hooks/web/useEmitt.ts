import mitt from 'mitt'
import { getCurrentScope, onScopeDispose } from 'vue'

interface Option {
  name: string // 事件名称
  callback: Fn // 回调
}

const emitter = mitt()

export const useEmitt = (option?: Option) => {
  if (option) {
    emitter.on(option.name, option.callback)

    // 组件卸载或 effectScope 停止时只移除本次注册的回调，不影响其他监听（含 useEventBus）
    if (getCurrentScope()) {
      onScopeDispose(() => {
        emitter.off(option.name, option.callback)
      })
    }
  }

  return {
    emitter
  }
}
