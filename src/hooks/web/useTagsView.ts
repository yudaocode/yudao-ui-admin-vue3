import { useTagsViewStoreWithOut } from '@/store/modules/tagsView'
import { RouteLocationNormalizedLoaded, useRouter } from 'vue-router'
import { computed, nextTick, unref } from 'vue'

export const useTagsView = () => {
  const tagsViewStore = useTagsViewStoreWithOut()

  const { replace, currentRoute } = useRouter()

  const selectedTag = computed(() => tagsViewStore.getSelectedTag)

  const closeAll = (callback?: Fn) => {
    tagsViewStore.delAllViews()
    callback?.()
  }

  const closeLeft = (callback?: Fn) => {
    tagsViewStore.delLeftViews(unref(selectedTag) as RouteLocationNormalizedLoaded)
    callback?.()
  }

  const closeRight = (callback?: Fn) => {
    tagsViewStore.delRightViews(unref(selectedTag) as RouteLocationNormalizedLoaded)
    callback?.()
  }

  const closeOther = (callback?: Fn) => {
    tagsViewStore.delOthersViews(unref(selectedTag) as RouteLocationNormalizedLoaded)
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
    tagsViewStore.delCachedView()
    const { path, query } = view || unref(currentRoute)
    await nextTick()
    replace({
      path: '/redirect' + path,
      query: query
    })
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
