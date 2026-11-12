import { pathResolve } from '@/utils/routerHelper'
import type { RouteMeta } from 'vue-router'

export const filterBreadcrumb = (
  routes: AppRouteRecordRaw[],
  parentPath = ''
): AppRouteRecordRaw[] => {
  const res: AppRouteRecordRaw[] = []

  for (const route of routes) {
    // 路由未配置 meta 时按空对象处理，避免读取属性报错
    const meta = (route?.meta ?? {}) as RouteMeta
    if (meta.hidden && !meta.canTo) {
      continue
    }

    const data: AppRouteRecordRaw =
      !meta.alwaysShow && route.children?.length === 1
        ? { ...route.children[0], path: pathResolve(route.path, route.children[0].path) }
        : { ...route }

    data.path = pathResolve(parentPath, data.path)

    if (data.children) {
      data.children = filterBreadcrumb(data.children, data.path)
    }
    if (data) {
      res.push(data)
    }
  }
  return res
}
