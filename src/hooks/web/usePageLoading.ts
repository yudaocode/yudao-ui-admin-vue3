import { useAppStoreWithOut } from '@/store/modules/app'

export const usePageLoading = () => {
  // 每次操作时获取 store，避免持有已 $dispose 的旧实例
  const loadStart = () => {
    const appStore = useAppStoreWithOut()

    appStore.setPageLoading(true)
  }

  const loadDone = () => {
    const appStore = useAppStoreWithOut()

    appStore.setPageLoading(false)
  }

  return {
    loadStart,
    loadDone
  }
}
