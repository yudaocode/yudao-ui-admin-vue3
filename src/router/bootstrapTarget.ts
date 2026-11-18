import type {
  NavigationGuardWithThis,
  RouteLocationNormalized,
  RouteLocationRaw,
  RouteRecordRaw
} from 'vue-router'

// 等待首次加载（用户信息、菜单路由）的导航在加载结束后要跳转的目标，按导航的目标路由对象区分。
// failed 为 true 表示加载失败、跳转登录页，否则为加载成功后回到原目标
const bootstrapTargets = new WeakMap<
  RouteLocationNormalized,
  { location: RouteLocationRaw; failed: boolean }
>()

export const setBootstrapTarget = (
  to: RouteLocationNormalized,
  location: RouteLocationRaw,
  failed: boolean
) => {
  bootstrapTargets.set(to, { location, failed })
}

// 取出并移除导航的跳转目标；onlyFailed 时只取加载失败的目标，加载成功的目标留给 beforeResolve
export const consumeBootstrapTarget = (
  to: RouteLocationNormalized,
  onlyFailed = false
): RouteLocationRaw | undefined => {
  const target = bootstrapTargets.get(to)
  if (!target || (onlyFailed && !target.failed)) return
  bootstrapTargets.delete(to)
  return target.location
}

// 加载失败时尽早跳转登录页：路由记录的 beforeEnter 在 Vue Router 对 beforeEach 等守卫的取消检查之后、
// 加载目标页面组件之前执行，已被新导航取代的旧导航走不到这里；也不会先加载原目标的懒加载页面，
// 避免该页面加载失败时中断跳转、丢失登录页的 redirect。没有新进入的路由记录时由 beforeResolve 跳转
const bootstrapFailureGuard: NavigationGuardWithThis<undefined> = (to) => {
  return consumeBootstrapTarget(to, true)
}

// 为路由及其各级子路由加上 bootstrapFailureGuard，排在原有 beforeEnter 之前，原有守卫保持不变。
// 返回新的路由对象，不修改传入的路由（静态路由模块还用于生成菜单）
export const withBootstrapFailureGuard = (routes: RouteRecordRaw[]): RouteRecordRaw[] => {
  return routes.map((route) => {
    const { beforeEnter, children } = route
    const guards = beforeEnter ? (Array.isArray(beforeEnter) ? beforeEnter : [beforeEnter]) : []
    return {
      ...route,
      beforeEnter: [bootstrapFailureGuard, ...guards],
      ...(children ? { children: withBootstrapFailureGuard(children) } : {})
    } as RouteRecordRaw
  })
}
