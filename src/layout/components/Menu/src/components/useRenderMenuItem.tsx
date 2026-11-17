import { ElSubMenu, ElMenuItem } from 'element-plus'
import { hasOneShowingChild } from '../helper'
import { isUrl } from '@/utils/is'
import { useRenderMenuTitle } from './useRenderMenuTitle'
import { pathResolve } from '@/utils/routerHelper'
import { resolveDynamicPath } from '@/utils/routeParams'

export const useRenderMenuItem = () => {
  const { renderMenuTitle } = useRenderMenuTitle()

  const renderMenuItem = (routers: AppRouteRecordRaw[] = [], parentPath = '/') => {
    return routers
      .filter((v) => !v.meta?.hidden)
      .map((v) => {
        const meta = v.meta ?? {}
        const children = v.children || []
        const { oneShowingChild, onlyOneChild } = hasOneShowingChild(children, v)
        const fullPath = isUrl(v.path) ? v.path : pathResolve(parentPath, v.path)
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

        // 收为单项时以子级 meta 为准，新建对象，不修改路由：
        // 子级未配置图标（空串/null/undefined）则回退父级图标；
        // 子级未设置标题（undefined）时，标题与 titleSource 一起取父级，避免标题与其来源错配
        // （如父级后端原文标记套到子级的语言 key 上）；子级显式空标题保持为空
        const childMeta = onlyOneChild?.meta ?? {}
        const onlyOneChildMeta = onlyOneChild
          ? {
              ...childMeta,
              ...(childMeta.title === undefined
                ? { title: meta.title, titleSource: meta.titleSource }
                : {}),
              icon: childMeta.icon || meta.icon
            }
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
