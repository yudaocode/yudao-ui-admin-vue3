import { watch, ref } from 'vue'
import { isString } from '@/utils/is'
import { useAppStoreWithOut } from '@/store/modules/app'

export const useTitle = (newTitle?: string) => {
  const { t } = useI18n()
  // 每次调用时获取 store，避免持有已 $dispose 的旧实例
  const appStore = useAppStoreWithOut()

  const title = ref(
    newTitle ? `${appStore.getTitle} - ${t(newTitle as string)}` : appStore.getTitle
  )

  watch(
    title,
    (n, o) => {
      if (isString(n) && n !== o && document) {
        document.title = n
      }
    },
    { immediate: true }
  )

  return title
}
