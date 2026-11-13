import { findPath } from '@/utils/tree'

type OnlyOneChildType = AppRouteRecordRaw & { noShowingChildren?: boolean }

interface HasOneShowingChild {
  oneShowingChild?: boolean
  onlyOneChild?: OnlyOneChildType
}

export const getAllParentPath = <T = Recordable>(treeData: T[], path: string) => {
  const menuList = findPath(treeData, (n) => n.path === path) as AppRouteRecordRaw[]
  return (menuList || []).map((item) => item.path)
}

export const hasOneShowingChild = (
  children: AppRouteRecordRaw[] = [],
  parent: AppRouteRecordRaw
): HasOneShowingChild => {
  // 纯函数，不再为每个菜单节点创建 ref（参考上游 e66532cf9）；路由未配置 meta 时按未隐藏处理
  const showingChildren = children.filter((v) => !v.meta?.hidden)

  // When there is only one child router, the child router is displayed by default
  if (showingChildren.length === 1) {
    return {
      oneShowingChild: true,
      onlyOneChild: showingChildren[0]
    }
  }

  // Show parent if there are no child router to display
  if (!showingChildren.length) {
    return {
      oneShowingChild: true,
      onlyOneChild: { ...parent, path: '', noShowingChildren: true }
    }
  }

  // 多个可见子级时不提供 onlyOneChild：调用方（Menu.vue isSubMenuRoute、useRenderMenuItem）只在 oneShowingChild 为 true 时使用它
  return {
    oneShowingChild: false
  }
}
