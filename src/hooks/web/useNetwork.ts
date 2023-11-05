import { ref, onBeforeUnmount } from 'vue'

const useNetwork = () => {
  const online = ref(true)

  const updateNetwork = () => {
    online.value = navigator.onLine
  }

  window.addEventListener('online', updateNetwork)
  window.addEventListener('offline', updateNetwork)

  onBeforeUnmount(() => {
    window.removeEventListener('online', updateNetwork)
    window.removeEventListener('offline', updateNetwork)
  })

  return { online }
}

export { useNetwork }
