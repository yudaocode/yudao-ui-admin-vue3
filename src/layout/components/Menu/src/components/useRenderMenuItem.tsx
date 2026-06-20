import { ElSubMenu, ElMenuItem } from 'element-plus'
import { hasOneShowingChild } from '../helper'
import { isUrl } from '@/utils/is'
import { useRenderMenuTitle } from './useRenderMenuTitle'
import { pathResolve } from '@/utils/routerHelper'
import { resolveDynamicPath } from '@/utils/routeParams'

const { renderMenuTitle } = useRenderMenuTitle()

export const useRenderMenuItem = () =>
  // allRouters: AppRouteRecordRaw[] = [],
  {
    const renderMenuItem = (routers: AppRouteRecordRaw[] = [], parentPath = '/') => {
      return routers
        .filter((v) => !v.meta?.hidden)
        .map((v) => {
          const meta = v.meta ?? {}
          const children = v.children || []
          const { oneShowingChild, onlyOneChild } = hasOneShowingChild(children, v)
          const fullPath = isUrl(v.path) ? v.path : pathResolve(parentPath, v.path) // getAllParentPath<AppRouteRecordRaw>(allRouters, v.path).join('/')
          const resolvedFullPath = isUrl(fullPath)
            ? fullPath
            : resolveDynamicPath(fullPath, meta.params as Record<string, any>)
          const onlyOneChildPath = onlyOneChild
            ? pathResolve(fullPath, onlyOneChild.path)
            : resolvedFullPath
          const resolvedOnlyOneChildPath = isUrl(onlyOneChildPath)
            ? onlyOneChildPath
            : resolveDynamicPath(
                onlyOneChildPath,
                (onlyOneChild?.meta?.params || meta.params) as Record<string, any>
              )

          if (
            !children.length ||
            (oneShowingChild &&
              (!onlyOneChild?.children || onlyOneChild?.noShowingChildren) &&
              !meta?.alwaysShow)
          ) {
            return (
              <ElMenuItem index={resolvedOnlyOneChildPath}>
                {{
                  default: () => renderMenuTitle(onlyOneChild ? onlyOneChild?.meta : meta)
                }}
              </ElMenuItem>
            )
          } else {
            return (
              <ElSubMenu index={resolvedFullPath}>
                {{
                  title: () => renderMenuTitle(meta),
                  default: () => renderMenuItem(children, resolvedFullPath)
                }}
              </ElSubMenu>
            )
          }
        })
    }

    return {
      renderMenuItem
    }
  }
