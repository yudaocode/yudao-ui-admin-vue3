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

          // 收为单项时（参考上游 e66532cf9）：唯一子级未配置图标（空串/null/undefined）则回退父级图标；
          // 标题、titleSource 等其余 meta 仍取子级，新建对象，不修改路由
          const onlyOneChildMeta = onlyOneChild
            ? { ...onlyOneChild.meta, icon: onlyOneChild.meta?.icon || meta.icon }
            : meta

          if (
            !children.length ||
            (oneShowingChild &&
              (!onlyOneChild?.children || onlyOneChild?.noShowingChildren) &&
              !meta?.alwaysShow)
          ) {
            return (
              <ElMenuItem index={resolvedOnlyOneChildPath}>
                {{
                  default: () => renderMenuTitle(onlyOneChildMeta)
                }}
              </ElMenuItem>
            )
          } else {
            // teleported：各级子菜单弹层都挂载到 body，避免多级弹层被上级弹层的滚动区域裁切
            return (
              <ElSubMenu index={resolvedFullPath} teleported>
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
