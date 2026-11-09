import router from '@/router'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { getRawRoute } from '@/utils/routerHelper'
import { defineStore } from 'pinia'
import { store } from '../index'
import { findIndex } from '@/utils'
import { useUserStoreWithOut } from './user'

export interface TagsViewState {
  visitedViews: RouteLocationNormalizedLoaded[]
  cachedViews: Set<string>
  selectedTag?: RouteLocationNormalizedLoaded
}

export const useTagsViewStore = defineStore('tagsView', {
  state: (): TagsViewState => ({
    visitedViews: [],
    cachedViews: new Set(),
    selectedTag: undefined
  }),
  getters: {
    getVisitedViews(): RouteLocationNormalizedLoaded[] {
      return this.visitedViews
    },
    getCachedViews(): string[] {
      return Array.from(this.cachedViews)
    },
    getSelectedTag(): RouteLocationNormalizedLoaded | undefined {
      return this.selectedTag
    }
  },
  actions: {
    // 新增缓存和tag
    addView(view: RouteLocationNormalizedLoaded): void {
      this.addVisitedView(view)
      this.addCachedView()
    },
    // 新增tag
    addVisitedView(view: RouteLocationNormalizedLoaded) {
      if (this.visitedViews.some((v) => v.fullPath === view.fullPath)) return
      if (view.meta?.noTagsView) return
      const visitedView = Object.assign({}, view, { title: view.meta?.title || 'no-name' })

      if (visitedView.meta) {
        const titleSuffixList: string[] = []
        this.visitedViews.forEach((v) => {
          if (v.path === visitedView.path && v.meta?.title === visitedView.meta?.title) {
            titleSuffixList.push(v.meta?.titleSuffix || '1')
          }
        })
        if (titleSuffixList.length) {
          let titleSuffix = 1
          while (titleSuffixList.includes(`${titleSuffix}`)) {
            titleSuffix += 1
          }
          visitedView.meta.titleSuffix = titleSuffix === 1 ? undefined : `${titleSuffix}`
        }
      }

      this.visitedViews.push(visitedView)
    },
    // 新增缓存
    addCachedView() {
      const cacheMap: Set<string> = new Set()
      for (const v of this.visitedViews) {
        const item = getRawRoute(v)
        // 空路由项（null / undefined）直接跳过，避免读取 meta、name 时报错（参考上游 4169e52ba）
        if (!item) {
          continue
        }
        const needCache = !item.meta?.noCache
        if (!needCache) {
          continue
        }
        const name = item.name as string
        cacheMap.add(name)
      }
      if (Array.from(this.cachedViews).sort().toString() === Array.from(cacheMap).sort().toString())
        return
      this.cachedViews = cacheMap
    },
    // 删除某个
    delView(view: RouteLocationNormalizedLoaded) {
      this.delVisitedView(view)
      this.addCachedView()
    },
    // 删除tag
    delVisitedView(view: RouteLocationNormalizedLoaded) {
      for (const [i, v] of this.visitedViews.entries()) {
        if (v.fullPath === view.fullPath) {
          this.visitedViews.splice(i, 1)
          break
        }
      }
    },
    // 删除缓存（按路由名）：传入 view 时删除该页的缓存（参考上游 e66532cf9 refreshTag），
    // 未传入时删除当前路由的缓存
    delCachedView(view?: RouteLocationNormalizedLoaded) {
      const route = view || router.currentRoute.value
      const index = findIndex<string>(this.getCachedViews, (v) => v === route.name)
      // 需要注释，解决“标签页刷新无效”。相关案例：https://github.com/yudaocode/yudao-ui-admin-vue3/issues/180
      // for (const v of this.visitedViews) {
      //   if (v.name === route.name) {
      //     return
      //   }
      // }
      if (index > -1) {
        this.cachedViews.delete(this.getCachedViews[index])
      }
    },
    // view 的路由名是否只对应一个缓存实例：AppView 的 KeepAlive 以 meta.viewKey || fullPath 为 key、
    // 按路由名 include，同名多个实例（如同一路径不同 query）时按名删除缓存会一并清掉其它实例
    isSingleCachedInstance(view: RouteLocationNormalizedLoaded): boolean {
      const keys = new Set<string>([view.meta?.viewKey || view.fullPath])
      for (const v of this.visitedViews) {
        const item = getRawRoute(v)
        if (!item || item.meta?.noCache || item.name !== view.name) {
          continue
        }
        keys.add(v.meta?.viewKey || v.fullPath)
      }
      return keys.size === 1
    },
    // 删除所有缓存和tag
    delAllViews() {
      this.delAllVisitedViews()
      this.addCachedView()
    },
    // 删除所有tag
    delAllVisitedViews() {
      const userStore = useUserStoreWithOut()

      // const affixTags = this.visitedViews.filter((tag) => tag.meta.affix)
      // 使用 isSetUser 判断登录态：resetState 后 user 仍是非空对象，不能用 getUser 判断
      this.visitedViews = userStore.getIsSetUser
        ? this.visitedViews.filter((tag) => tag?.meta?.affix)
        : []
    },
    // 删除其他
    delOthersViews(view: RouteLocationNormalizedLoaded) {
      this.delOthersVisitedViews(view)
      this.addCachedView()
    },
    // 删除其他tag
    delOthersVisitedViews(view: RouteLocationNormalizedLoaded) {
      this.visitedViews = this.visitedViews.filter((v) => {
        return v?.meta?.affix || v.fullPath === view.fullPath
      })
    },
    // 删除左侧
    delLeftViews(view: RouteLocationNormalizedLoaded) {
      const index = findIndex<RouteLocationNormalizedLoaded>(
        this.visitedViews,
        (v) => v.fullPath === view.fullPath
      )
      if (index > -1) {
        this.visitedViews = this.visitedViews.filter((v, i) => {
          return v?.meta?.affix || v.fullPath === view.fullPath || i > index
        })
        this.addCachedView()
      }
    },
    // 删除右侧
    delRightViews(view: RouteLocationNormalizedLoaded) {
      const index = findIndex<RouteLocationNormalizedLoaded>(
        this.visitedViews,
        (v) => v.fullPath === view.fullPath
      )
      if (index > -1) {
        this.visitedViews = this.visitedViews.filter((v, i) => {
          return v?.meta?.affix || v.fullPath === view.fullPath || i < index
        })
        this.addCachedView()
      }
    },
    updateVisitedView(view: RouteLocationNormalizedLoaded) {
      for (let v of this.visitedViews) {
        if (v.fullPath === view.fullPath) {
          v = Object.assign(v, view)
          break
        }
      }
    },
    // 设置当前选中的 tag
    setSelectedTag(tag: RouteLocationNormalizedLoaded) {
      this.selectedTag = tag
    },
    // 设置 tag 标题：显式传入 path（含空字符串）时修改该 path 的第一个 tag；
    // 未传入（undefined / null）时修改当前选中的 tag，没有选中的 tag 则不修改
    setTitle(title: string, path?: string) {
      const selectedTag = this.selectedTag
      if (path == null && !selectedTag) return
      const isTarget = (v: RouteLocationNormalizedLoaded) => {
        if (path != null) return v.path === path
        // 芋道同一路径、不同 query 的页面各自成 tag，当前 tag 按 fullPath 定位；没有 fullPath 的自建 tag 回退按 path
        return selectedTag?.fullPath
          ? v.fullPath === selectedTag.fullPath
          : v.path === selectedTag?.path
      }
      for (const v of this.visitedViews) {
        if (isTarget(v)) {
          v.meta.title = title
          break
        }
      }
    }
  },
  persist: false
})

export const useTagsViewStoreWithOut = () => {
  return useTagsViewStore(store)
}
