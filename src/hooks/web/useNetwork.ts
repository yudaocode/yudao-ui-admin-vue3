import { ref, getCurrentScope, onScopeDispose } from 'vue'

// 读取当前网络状态；无 navigator 或不支持 onLine 时按在线处理
const isOnline = () =>
  typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
    ? navigator.onLine
    : true

const useNetwork = () => {
  // 初始值取当前状态，避免离线打开页面时在首个事件前误报在线
  const online = ref(isOnline())

  const updateNetwork = () => {
    online.value = isOnline()
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', updateNetwork)
    window.addEventListener('offline', updateNetwork)

    // 组件卸载或 effectScope 停止时移除监听；不在作用域内调用时由调用方自行管理生命周期
    if (getCurrentScope()) {
      onScopeDispose(() => {
        window.removeEventListener('online', updateNetwork)
        window.removeEventListener('offline', updateNetwork)
      })
    }
  }

  return { online }
}

export { useNetwork }
