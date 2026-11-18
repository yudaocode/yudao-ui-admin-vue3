type OnlyOneChildType = AppRouteRecordRaw & { noShowingChildren?: boolean }

interface HasOneShowingChild {
  oneShowingChild?: boolean
  onlyOneChild?: OnlyOneChildType
}

export const hasOneShowingChild = (
  children: AppRouteRecordRaw[] = [],
  parent: AppRouteRecordRaw
): HasOneShowingChild => {
  const showingChildren = children.filter((v) => {
    return !v.meta?.hidden
  })

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

  return {
    oneShowingChild: false
  }
}
