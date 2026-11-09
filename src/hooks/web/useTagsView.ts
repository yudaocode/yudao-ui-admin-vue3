import { useTagsViewStoreWithOut } from '@/store/modules/tagsView'
import { RouteLocationNormalizedLoaded, useRouter } from 'vue-router'
import { computed, nextTick, unref } from 'vue'

export const useTagsView = () => {
  const tagsViewStore = useTagsViewStoreWithOut()

  const { replace, resolve, afterEach, currentRoute } = useRouter()

  const selectedTag = computed(() => tagsViewStore.getSelectedTag)

  const closeAll = (callback?: Fn) => {
    tagsViewStore.delAllViews()
    callback?.()
  }

  // 批量关闭以 view 为基准，未传 view 时使用当前选中的 tag
  const closeLeft = (callback?: Fn, view?: RouteLocationNormalizedLoaded) => {
    tagsViewStore.delLeftViews((view || unref(selectedTag)) as RouteLocationNormalizedLoaded)
    callback?.()
  }

  const closeRight = (callback?: Fn, view?: RouteLocationNormalizedLoaded) => {
    tagsViewStore.delRightViews((view || unref(selectedTag)) as RouteLocationNormalizedLoaded)
    callback?.()
  }

  const closeOther = (callback?: Fn, view?: RouteLocationNormalizedLoaded) => {
    tagsViewStore.delOthersViews((view || unref(selectedTag)) as RouteLocationNormalizedLoaded)
    callback?.()
  }

  const closeCurrent = (view?: RouteLocationNormalizedLoaded, callback?: Fn) => {
    // 未传 view 时关闭当前路由，同样不能关闭固定标签
    const target = view || unref(currentRoute)
    if (target?.meta?.affix) return
    tagsViewStore.delView(target)

    callback?.()
  }

  const refreshPage = async (view?: RouteLocationNormalizedLoaded, callback?: Fn) => {
    const target = view || unref(currentRoute)
    // 传入 view 且其路由名只对应一个缓存实例时，删除被刷新页（而非当前路由）的缓存，
    // 并且只在跳转到对应 /redirect 地址成功后删除：守卫拒绝、被其它导航取代或出错时保留缓存。
    // 其余情况（未传 view、同名多个缓存实例）沿用原逻辑：跳转前删除当前路由的缓存，不保证目标页重新创建
    const removeTargetCache = !!view && tagsViewStore.isSingleCachedInstance(view)
    if (!removeTargetCache) {
      tagsViewStore.delCachedView()
    }
    const { path, query } = target
    await nextTick()
    const location = {
      path: '/redirect' + path,
      query: query
    }
    let removeAfterEach: (() => void) | undefined
    if (removeTargetCache) {
      const redirectFullPath = resolve(location).fullPath
      // 导航成功时 afterEach 在 Redirect 页渲染前同步触发，此时删除缓存，返回目标页时重新创建
      removeAfterEach = afterEach((to, _from, failure) => {
        if (failure || to.fullPath !== redirectFullPath) return
        removeAfterEach?.()
        tagsViewStore.delCachedView(target)
      })
    }
    replace(location).finally(() => removeAfterEach?.())
    callback?.()
  }

  const setTitle = (title: string, path?: string) => {
    tagsViewStore.setTitle(title, path)
  }

  return {
    closeAll,
    closeLeft,
    closeRight,
    closeOther,
    closeCurrent,
    refreshPage,
    setTitle
  }
}
