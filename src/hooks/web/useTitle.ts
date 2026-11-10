import type { RouteMeta } from 'vue-router'
import { watch, ref, computed, effectScope } from 'vue'
import { isString } from '@/utils/is'
import { BACKEND_TITLE_SOURCE, getRouteTitle } from '@/utils/routeTitle'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useLocaleStoreWithOut } from '@/store/modules/locale'

// 当前页面标题（路由 meta.title，可为语言 key 或后端菜单原文）及其来源标记，每次导航由 useTitle 更新
const titleMeta = ref<RouteMeta>({})

// 全局唯一的页面标题：随导航、系统标题及不刷新的语言切换响应式更新
const title = computed(() => {
  // 每次求值时获取 store，避免持有已 $dispose 的旧实例
  const appStore = useAppStoreWithOut()
  // 显式依赖当前语言，切换语言后重新翻译
  void useLocaleStoreWithOut().getCurrentLocale.lang
  const newTitle = getRouteTitle(titleMeta.value)
  return newTitle ? `${appStore.getTitle} - ${newTitle}` : appStore.getTitle
})

let titleWatching = false

// backendTitle 为 true 时 newTitle 是后端菜单原文，原样展示不翻译（见 isBackendTitle）
export const useTitle = (newTitle?: string, backendTitle = false) => {
  titleMeta.value = {
    title: newTitle,
    titleSource: backendTitle ? BACKEND_TITLE_SOURCE : undefined
  }
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
