import router from './router'
import {
  consumeBootstrapTarget,
  setBootstrapTarget,
  withBootstrapFailureGuard
} from './router/bootstrapTarget'
import { createRouterMatcher, isNavigationFailure, NavigationFailureType } from 'vue-router'
import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
import { isRelogin } from '@/config/axios/service'
import { getAccessToken, removeToken } from '@/utils/auth'
import { deleteUserCache } from '@/hooks/web/useCache'
import { useTitle } from '@/hooks/web/useTitle'
import { useNProgress } from '@/hooks/web/useNProgress'
import { usePageLoading } from '@/hooks/web/usePageLoading'
import { useDictStoreWithOut } from '@/store/modules/dict'
import { useUserStoreWithOut } from '@/store/modules/user'
import { usePermissionStoreWithOut } from '@/store/modules/permission'
import { isBackendTitle } from '@/utils/routeTitle'

const { start, done } = useNProgress()

const { loadStart, loadDone } = usePageLoading()

// 正在进行的首次加载（用户信息、生成菜单路由、注册动态路由）的 Promise
let bootstrapPromise: Promise<boolean> | undefined

// 已成功注册过的动态路由名。登出不刷新页面、不重置路由，重新登录时同名动态路由按原逻辑替换，不视为冲突
const dynamicRouteNames = new Set<string | symbol>()

// 收集输入记录（含各级子路由）的全部路由名
const collectRouteNames = (routes: RouteRecordRaw[], names: Set<string | symbol>) => {
  routes.forEach((route) => {
    if (route.name) names.add(route.name)
    if (route.children) collectRouteNames(route.children, names)
  })
}

// 在不影响 router 的临时 matcher 中完整注册整批动态路由（与之后实际注册的是同一批记录）：
// 路径非法等会使 router.addRoute 注册到一半时抛错的问题在这里暴露，此时 router 尚未改动。
// 同时检查与 router 中已有的非动态路由（静态路由）同名，避免 addRoute 覆盖、删除静态路由。
// 同名检查遍历输入的全部原始记录，而不是临时 matcher 中最终保留的记录：同名的父路由后注册时会移除先注册的父路由及其子路由，
// 被移除的子路由在 router 中注册时仍会占用其名称，移除时再按名称删掉，与它同名的静态路由也随之失效。返回本批实际保留的路由名
const validateRoutes = (routes: RouteRecordRaw[]): Set<string | symbol> => {
  const matcher = createRouterMatcher([], router.options)
  routes.forEach((route) => matcher.addRoute(route))
  const inputNames = new Set<string | symbol>()
  collectRouteNames(routes, inputNames)
  inputNames.forEach((name) => {
    if (router.hasRoute(name) && !dynamicRouteNames.has(name)) {
      throw new Error(`动态路由与已注册的路由同名：${String(name)}`)
    }
  })
  const names = new Set<string | symbol>()
  matcher.getRoutes().forEach(({ record }) => {
    if (record.name) names.add(record.name)
  })
  return names
}

// 首次加载，成功返回 true；失败时清理登录状态并返回 false，由调用方跳转登录页（带 redirect，重新登录后回到原目标）。
// 失败处理在这里只执行一次，并在 bootstrapPromise 清空、下一次加载开始前完成，不会清掉之后加载的结果。
// 生成、注册菜单路由失败时同样跳转登录页，而不是抛错停留：首次导航出错会使 router.isReady() 拒绝，应用无法挂载
const bootstrap = async (): Promise<boolean> => {
  const userStore = useUserStoreWithOut()
  const permissionStore = usePermissionStoreWithOut()
  isRelogin.show = true
  try {
    await userStore.setUserInfoAction()
  } catch {
    // 没有用户缓存，且加载用户信息失败时，清理本地登录状态并跳转登录页，避免页面一直 loading
    // 详见 issue：https://gitee.com/yudaocode/yudao-ui-admin-vue3/issues/IBJ6SP
    removeToken()
    deleteUserCache()
    return false
  } finally {
    isRelogin.show = false
  }
  const removeRoutes: (() => void)[] = []
  try {
    // 后端过滤菜单
    await permissionStore.generateRoutes()
    // getAddRouters 每次读取都会深拷贝，只读取一次，保证预检与注册的是同一批记录；
    // 与静态路由一样加上首次加载失败时跳转登录页的守卫
    const routes = withBootstrapFailureGuard(
      permissionStore.getAddRouters as unknown as RouteRecordRaw[]
    )
    const names = validateRoutes(routes)
    routes.forEach((route) => {
      removeRoutes.push(router.addRoute(route)) // 动态添加可访问路由表
    })
    names.forEach((name) => dynamicRouteNames.add(name))
  } catch (error) {
    // 菜单数据异常等导致生成、注册失败：撤销本次已注册的路由，清除用户、菜单状态，避免被视为已加载。
    // 预检失败时 router 未改动；预检通过后 addRoute 不会再因记录本身抛错，removeRoutes 仅作兜底
    console.error(error)
    removeRoutes.forEach((removeRoute) => removeRoute())
    permissionStore.$reset()
    userStore.resetState()
    removeToken()
    deleteUserCache()
    return false
  }
  return true
}

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

// 最近一次进入全局前置守卫的目标路由，用于判断出错的导航是否仍是最新导航
let pendingTo: RouteLocationNormalized | undefined

// 路由加载前
router.beforeEach(async (to, from, next) => {
  pendingTo = to
  start()
  loadStart()
  if (getAccessToken()) {
    if (to.path === '/login') {
      next({ path: '/' })
    } else {
      const dictStore = useDictStoreWithOut()
      const userStore = useUserStoreWithOut()
      // 异步加载字典
      // 另外，间接 issue：https://gitee.com/yudaocode/yudao-ui-admin-vue3/issues/ID9FLI
      if (!dictStore.getIsSetDict) {
        dictStore.setDictMap().then()
      }
      // 加载进行中时，即使用户信息已写入（菜单路由尚未注册），也等待同一次加载
      if (!userStore.getIsSetUser || bootstrapPromise) {
        const redirectPath = from.query.redirect
        // 修复跳转时不带参数的问题。与登录表单一致，只接受站内绝对路径；相对、协议相对等无效值回退到当前目标
        const redirect =
          typeof redirectPath === 'string' &&
          redirectPath.startsWith('/') &&
          !redirectPath.startsWith('//')
            ? redirectPath
            : to.fullPath
        // 并发跳转时，共用同一次加载，避免先后返回的成功、失败结果互相覆盖登录状态
        if (!bootstrapPromise) {
          bootstrapPromise = bootstrap().finally(() => {
            bootstrapPromise = undefined
          })
        }
        // 不在这里直接 next(目标)，而是放行后由路由记录的 beforeEnter（仅加载失败时）或 beforeResolve 跳转，见下方说明
        if (!(await bootstrapPromise)) {
          setBootstrapTarget(to, `/login?redirect=${encodeURIComponent(redirect)}`, true)
        } else {
          // 动态路由注册后按 URL 重新匹配，不沿用注册前匹配到的路由名、参数；
          // 按 Vue Router 自身的规则解析，原样保留无值、重复的 query 参数及已编码的 hash
          const { path, query, hash } = router.resolve(redirect)
          setBootstrapTarget(to, { path, query, hash, replace: true }, false)
        }
        next()
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

// 等待首次加载的导航在这里才跳转。若在 beforeEach 中直接 next(目标)，重定向先于 Vue Router 的取消检查生效，
// 等待期间已被更新的导航（包括不经过 beforeEach 的重复导航）取代的旧导航会再次跳转、覆盖新导航。
// 放行 beforeEach 后，Vue Router 在每组守卫之后检查导航是否已被取代：被取代的旧导航走不到这里，以 cancelled 结束；
// 多个导航共用同一次加载时，只有最新的一个跳转。跳转后的导航没有跳转目标，不会重复跳转。
// 加载失败的目标通常已由路由记录的 beforeEnter 提前取走（见 router/bootstrapTarget.ts），这里处理加载成功、
// 以及没有新进入的路由记录（不执行 beforeEnter）时的失败目标
router.beforeResolve((to) => consumeBootstrapTarget(to))

router.afterEach((to, _from, failure) => {
  // 旧导航被新导航取代（cancelled）时，若新导航已进入前置守卫，加载状态由新导航结束，这里不提前结束。
  // 其它失败（中止、重复导航等）照常结束：重复导航不经过前置守卫，但它本身会取代进行中的导航
  if (isNavigationFailure(failure, NavigationFailureType.cancelled) && to !== pendingTo) return
  // 导航被中止、取消时，当前路由未变化，不更新标题
  if (!failure) {
    useTitle(to?.meta?.title as string, isBackendTitle(to?.meta))
  }
  done() // 结束Progress
  loadDone()
})

// 守卫抛错、懒加载失败时 Vue Router 不调用 afterEach，在这里结束进度条和页面加载状态。
// 只处理最新导航的错误：被新导航取代后才出错的旧导航不结束新导航的加载状态。
// 动态导入失败的整页刷新由 router/index.ts 中先注册的 onError 处理，这里不影响
router.onError((_error, to) => {
  if (to !== pendingTo) return
  done()
  loadDone()
})
