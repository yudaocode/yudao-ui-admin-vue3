import { watch, ref, computed, effectScope } from 'vue'
import { isString } from '@/utils/is'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useLocaleStoreWithOut } from '@/store/modules/locale'

// 当前页面标题（路由 meta.title，可为语言 key 或后端菜单原文），每次导航由 useTitle 更新
const titleKey = ref<string>()

// 全局唯一的页面标题：随导航、系统标题及不刷新的语言切换响应式更新
const title = computed(() => {
  const { t } = useI18n()
  // 每次求值时获取 store，避免持有已 $dispose 的旧实例
  const appStore = useAppStoreWithOut()
  // 显式依赖当前语言，切换语言后重新翻译
  void useLocaleStoreWithOut().getCurrentLocale.lang
  const newTitle = titleKey.value
  return newTitle ? `${appStore.getTitle} - ${t(newTitle)}` : appStore.getTitle
})

let titleWatching = false

export const useTitle = (newTitle?: string) => {
  titleKey.value = newTitle
  // 只注册一次监听（独立作用域，不随调用方销毁），避免每次导航累积 watcher
  if (!titleWatching) {
    titleWatching = true
    effectScope(true).run(() => {
      watch(
        title,
        (n, o) => {
          if (isString(n) && n !== o && document) {
            document.title = n
          }
        },
        { immediate: true }
      )
    })
  }

  return title
}
