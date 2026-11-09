import router from './router'
import type { RouteRecordRaw } from 'vue-router'
import { isRelogin } from '@/config/axios/service'
import { getAccessToken, removeToken } from '@/utils/auth'
import { deleteUserCache } from '@/hooks/web/useCache'
import { useTitle } from '@/hooks/web/useTitle'
import { useNProgress } from '@/hooks/web/useNProgress'
import { usePageLoading } from '@/hooks/web/usePageLoading'
import { useDictStoreWithOut } from '@/store/modules/dict'
import { useUserStoreWithOut } from '@/store/modules/user'
import { usePermissionStoreWithOut } from '@/store/modules/permission'
import { parseRouteLocation } from '@/utils/routeParams'

const { start, done } = useNProgress()

const { loadStart, loadDone } = usePageLoading()

// 正在加载用户信息的 Promise
let userInfoPromise: Promise<unknown> | undefined

// 路由不重定向白名单
const whiteList = [
  '/login',
  '/social-login',
  '/auth-redirect',
  '/bind',
  '/register',
  '/oauthLogin/gitee',
  '/pms/kb/document/share'
]

// 路由加载前
router.beforeEach(async (to, from, next) => {
  start()
  loadStart()
  if (getAccessToken()) {
    if (to.path === '/login') {
      next({ path: '/' })
    } else {
      const dictStore = useDictStoreWithOut()
      const userStore = useUserStoreWithOut()
      const permissionStore = usePermissionStoreWithOut()
      // 异步加载字典
      // 另外，间接 issue：https://gitee.com/yudaocode/yudao-ui-admin-vue3/issues/ID9FLI
      if (!dictStore.getIsSetDict) {
        dictStore.setDictMap().then()
      }
      if (!userStore.getIsSetUser) {
        const redirectPath = from.query.redirect
        // 修复跳转时不带参数的问题
        const redirect = typeof redirectPath === 'string' ? redirectPath : to.fullPath
        isRelogin.show = true
        try {
          // 并发跳转时，共用同一次加载，避免先后返回的成功、失败结果互相覆盖登录状态
          if (!userInfoPromise) {
            userInfoPromise = userStore.setUserInfoAction().finally(() => {
              userInfoPromise = undefined
            })
          }
          await userInfoPromise
        } catch {
          // 没有用户缓存，且加载用户信息失败时，清理本地登录状态并跳转登录页，避免页面一直 loading
          // 详见 issue：https://gitee.com/yudaocode/yudao-ui-admin-vue3/issues/IBJ6SP
          removeToken()
          deleteUserCache()
          next(`/login?redirect=${encodeURIComponent(redirect)}`)
          return
        } finally {
          isRelogin.show = false
        }
        // 后端过滤菜单
        await permissionStore.generateRoutes()
        permissionStore.getAddRouters.forEach((route) => {
          router.addRoute(route as unknown as RouteRecordRaw) // 动态添加可访问路由表
        })
        const redirectLocation = parseRouteLocation(redirect)
        const nextData =
          to.fullPath === redirect
            ? { ...to, replace: true }
            : { ...redirectLocation, replace: true }
        next(nextData)
      } else {
        next()
      }
    }
  } else {
    if (whiteList.some((path) => to.path === path || to.path.startsWith(`${path}/`))) {
      next()
    } else {
      next(`/login?redirect=${encodeURIComponent(to.fullPath)}`) // 否则全部重定向到登录页
    }
  }
})

router.afterEach((to) => {
  useTitle(to?.meta?.title as string)
  done() // 结束Progress
  loadDone()
})
