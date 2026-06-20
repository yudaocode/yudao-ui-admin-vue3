import { isUrl } from '@/utils/is'
import { getRootPath } from '@/utils/layout'
import { resolveDynamicPath } from '@/utils/routeParams'
import { pathResolve } from '@/utils/routerHelper'

export const normalizeMenuTargetPath = (targetPath: string): string => {
  if (!targetPath || isUrl(targetPath)) {
    return targetPath
  }
  return targetPath.startsWith('/') ? targetPath : pathResolve('/', targetPath)
}

export const findRouteByPath = (
  routes: AppRouteRecordRaw[],
  targetPath: string,
  parentPath = '/',
  preferChild = true
): { fullPath: string; route: AppRouteRecordRaw } | undefined => {
  for (const route of routes) {
    const fullPath = isUrl(route.path) ? route.path : pathResolve(parentPath, route.path)
    const resolvedFullPath = resolveDynamicPath(fullPath, route.meta?.params as Record<string, any>)
    if (fullPath === targetPath || resolvedFullPath === targetPath) {
      const child = preferChild
        ? findRouteByPath(route.children || [], targetPath, fullPath, preferChild)
        : undefined
      if (child) {
        return child
      }
      return { fullPath: resolvedFullPath, route }
    }
    const child = route.children?.length
      ? findRouteByPath(route.children, targetPath, fullPath, preferChild)
      : undefined
    if (child) {
      return child
    }
  }
}

export const getRootMenuRoute = (
  routes: AppRouteRecordRaw[],
  targetPath: string
): { fullPath: string; route: AppRouteRecordRaw } | undefined => {
  const normalizedPath = normalizeMenuTargetPath(targetPath)
  for (const route of routes) {
    if (route.meta?.hidden) {
      continue
    }
    const fullPath = isUrl(route.path) ? route.path : pathResolve('/', route.path)
    const resolvedFullPath = resolveDynamicPath(fullPath, route.meta?.params as Record<string, any>)
    if (
      resolvedFullPath === normalizedPath ||
      (resolvedFullPath !== '/' && normalizedPath.startsWith(`${resolvedFullPath}/`)) ||
      findRouteByPath(route.children || [], normalizedPath, fullPath)
    ) {
      return { fullPath: resolvedFullPath, route }
    }
  }
}

export const getRootMenuActivePath = (routes: AppRouteRecordRaw[], targetPath: string): string => {
  return (
    getRootMenuRoute(routes, targetPath)?.fullPath ||
    getRootPath(normalizeMenuTargetPath(targetPath))
  )
}
