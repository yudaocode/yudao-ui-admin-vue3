import type { App } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import remainingRouter from './modules/remaining'
import { withBootstrapFailureGuard } from './bootstrapTarget'
import { restoreSocialRoute } from '@/utils/social'

// 使用 createWebHashHistory 时，需要先还原第三方登录回调的目标路由，详见 buildSocialRedirectUri() 说明
restoreSocialRoute()

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_PATH), // createWebHashHistory URL带#，createWebHistory URL不带#
  strict: true,
  // 首次加载失败时跳转登录页的守卫，见 bootstrapTarget.ts
  routes: withBootstrapFailureGuard(remainingRouter as RouteRecordRaw[]),
  scrollBehavior: () => {
    // 新开标签时、返回标签时，滚动条回到顶部，否则会保留上次标签的滚动位置。
    const scrollbarWrap = document.querySelector('.v-layout-content-scrollbar .el-scrollbar__wrap')
    if (scrollbarWrap) {
      // scrollbarWrap.scrollTo({ left: 0, top: 0, behavior: 'auto' })
      scrollbarWrap.scrollTop = 0
    }
    return { left: 0, top: 0 }
  }
})

// 处理动态导入失败（如重新构建后 chunk 哈希变化），自动跳转到目标页面
router.onError((error, to) => {
  // 守卫可能抛出字符串等非 Error 值，先确认 message 为字符串，避免本处理器抛错而中断后续 onError 处理器
  const message = error?.message
  if (typeof message !== 'string') return
  if (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed')
  ) {
    window.location.assign(to.fullPath)
  }
})

// 创建路由实例时注册的全部静态路由（登录、SSO、第三方登录、分享页、业务详情页等）的路由名，重置时保留
const staticRouteNames = new Set(router.getRoutes().map((route) => route.name))

// 是否为初始静态路由名：动态路由不能与之同名，否则 addRoute 会覆盖、删除静态路由
export const isStaticRouteName = (name: string | symbol): boolean => staticRouteNames.has(name)

// 重置为初始静态路由表：只移除之后动态注册的路由
export const resetRouter = (): void => {
  router.getRoutes().forEach((route) => {
    const { name } = route
    if (name && !staticRouteNames.has(name)) {
      router.hasRoute(name) && router.removeRoute(name)
    }
  })
}

export const setupRouter = (app: App<Element>) => {
  app.use(router)
}

export default router
