<script lang="tsx">
import { PropType, nextTick, onBeforeUnmount, onMounted } from 'vue'
import { ElMenu, ElScrollbar } from 'element-plus'
import type { MenuInstance } from 'element-plus'
import { useAppStore } from '@/store/modules/app'
import { usePermissionStore } from '@/store/modules/permission'
import { useRenderMenuItem } from './components/useRenderMenuItem'
import { hasOneShowingChild } from './helper'
import { isUrl } from '@/utils/is'
import { useDesign } from '@/hooks/web/useDesign'
import { createRouteLocation, resolveDynamicPath } from '@/utils/routeParams'
import { isHeaderNavLayout, isHorizontalMenuLayout, isTwoColumnLayout } from '@/utils/layout'
import { cloneDeep } from 'lodash-es'
import { pathResolve } from '@/utils/routerHelper'
import {
  findRouteByPath,
  getRootMenuActivePath,
  getRootMenuRoute,
  normalizeMenuTargetPath
} from './menuRoute'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('menu')

export default defineComponent({
  name: 'Menu',
  props: {
    mode: {
      type: String as PropType<'horizontal' | 'vertical'>,
      default: undefined
    },
    menuSelect: {
      type: Function as PropType<(index: string) => void>,
      default: undefined
    },
    rootOnly: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String as PropType<'header' | 'menu'>,
      default: 'menu'
    },
    split: {
      type: Boolean,
      default: false
    },
    menus: {
      type: Array as PropType<AppRouteRecordRaw[]>,
      default: undefined
    }
  },
  setup(props) {
    const appStore = useAppStore()

    const layout = computed(() => appStore.getLayout)

    const { push, currentRoute, resolve } = useRouter()

    const { t } = useI18n()

    const permissionStore = usePermissionStore()

    const menuWrapRef = ref<HTMLElement>()

    const menuRef = ref<MenuInstance>()

    const menuMode = computed(
      (): 'vertical' | 'horizontal' =>
        props.mode || (isHorizontalMenuLayout(unref(layout)) ? 'horizontal' : 'vertical')
    )

    const collapse = computed(() => appStore.getCollapse)

    const uniqueOpened = computed(() => appStore.getUniqueOpened)

    const horizontalOverflowOpened = ref(false)

    const horizontalOverflowStyle = ref<Record<string, string>>({})

    const horizontalOverflowRoutes = ref<AppRouteRecordRaw[]>([])

    const getRootOnlyMenuRoute = (route: AppRouteRecordRaw): AppRouteRecordRaw => {
      const firstVisibleChild = route.children?.find((child) => !child.meta?.hidden)
      const meta =
        route.meta?.title || !firstVisibleChild
          ? route.meta
          : {
              ...route.meta,
              icon: firstVisibleChild.meta?.icon,
              title: firstVisibleChild.meta?.title
            }
      return {
        ...route,
        children: undefined,
        meta
      }
    }

    const routers = computed(() => {
      const sourceRouters =
        props.menus ||
        (props.split ? permissionStore.getMenuTabRouters : permissionStore.getRouters)
      if (!props.rootOnly) {
        return sourceRouters
      }
      return sourceRouters.map(getRootOnlyMenuRoute)
    })

    const activeMenu = computed(() => {
      const { meta, path } = unref(currentRoute)
      const currentPath = (meta.activeMenu as string) || path
      if (props.rootOnly) {
        return (
          permissionStore.getMenuRootPath ||
          getRootMenuActivePath(permissionStore.getRouters, currentPath)
        )
      }
      // if set path, the sidebar will highlight the path you set
      if (meta.activeMenu) {
        return normalizeMenuTargetPath(meta.activeMenu as string)
      }
      return path
    })

    const menuBgColor = computed(() =>
      props.theme === 'header' ? 'var(--top-header-bg-color)' : 'var(--left-menu-bg-color)'
    )

    const menuTextColor = computed(() =>
      props.theme === 'header' ? 'var(--top-header-text-color)' : 'var(--left-menu-text-color)'
    )

    const menuActiveTextColor = computed(() =>
      props.theme === 'header' ? 'var(--el-color-primary)' : 'var(--left-menu-text-active-color)'
    )

    const getFirstChildPath = (
      route: AppRouteRecordRaw,
      parentPath: string
    ): string | undefined => {
      const firstChild = route.children?.find((child) => !child.meta?.hidden)
      if (!firstChild) {
        return undefined
      }
      const childPath = pathResolve(parentPath, firstChild.path)
      if (firstChild.redirect) {
        return firstChild.redirect as string
      }
      if (firstChild.children?.length) {
        return getFirstChildPath(firstChild, childPath) || childPath
      }
      return childPath
    }

    const isSubMenuRoute = (route: AppRouteRecordRaw) => {
      const children = route.children || []
      const { oneShowingChild, onlyOneChild } = hasOneShowingChild(children, route)
      return (
        !!children.length &&
        !(
          oneShowingChild &&
          (!onlyOneChild?.children || onlyOneChild?.noShowingChildren) &&
          !route.meta?.alwaysShow
        )
      )
    }

    const findOpenMenuPaths = (
      routes: AppRouteRecordRaw[],
      targetPath: string,
      parentPath = '/',
      parents: string[] = []
    ): string[] => {
      for (const route of routes) {
        if (route.meta?.hidden) {
          continue
        }
        const fullPath = isUrl(route.path) ? route.path : pathResolve(parentPath, route.path)
        const resolvedFullPath = isUrl(fullPath)
          ? fullPath
          : resolveDynamicPath(fullPath, route.meta?.params as Record<string, any>)
        const nextParents = isSubMenuRoute(route) ? [...parents, resolvedFullPath] : parents
        const matchedSelf = fullPath === targetPath || resolvedFullPath === targetPath
        const matchedChild = route.children?.length
          ? findOpenMenuPaths(route.children, targetPath, fullPath, nextParents)
          : []

        if (matchedChild.length) {
          return matchedChild
        }
        if (
          matchedSelf ||
          (!isUrl(resolvedFullPath) &&
            resolvedFullPath !== '/' &&
            targetPath.startsWith(`${resolvedFullPath}/`))
        ) {
          return nextParents
        }
      }
      return []
    }

    const defaultOpeneds = computed(() => {
      if (unref(menuMode) === 'horizontal') {
        return []
      }
      if (props.rootOnly) {
        return []
      }
      return findOpenMenuPaths(unref(routers), normalizeMenuTargetPath(unref(activeMenu)))
    })

    let lastAutoOpeneds: string[] = []

    const warnMenuOpenError = (action: 'close' | 'open', path: string, error: unknown) => {
      if (!import.meta.env.DEV) {
        return
      }
      console.warn(`[Menu] Failed to ${action} submenu "${path}"`, error)
    }

    const setSplitMenus = (targetPath: string) => {
      const rootInfo = getRootMenuRoute(permissionStore.getRouters, targetPath)
      const rootPath =
        rootInfo?.fullPath || getRootMenuActivePath(permissionStore.getRouters, targetPath)
      const rootRoute = rootInfo?.route
      const children = rootRoute?.children?.length
        ? cloneDeep(rootRoute.children).map((child) => {
            child.path = pathResolve(rootPath, child.path)
            return child
          })
        : []
      permissionStore.setMenuRootPath(rootPath)
      permissionStore.setMenuTabRouters(children)
    }

    watch(
      () =>
        [
          (unref(currentRoute).meta.activeMenu as string) || unref(currentRoute).path,
          permissionStore.getRouters,
          props.rootOnly,
          props.split
        ] as const,
      ([path, _routers, rootOnly, split]) => {
        if (split) {
          setSplitMenus(path)
        } else if (rootOnly) {
          permissionStore.setMenuRootPath(getRootMenuActivePath(permissionStore.getRouters, path))
        }
      },
      {
        immediate: true
      }
    )

    const syncDefaultOpeneds = () => {
      if (unref(menuMode) === 'horizontal' || props.rootOnly) {
        lastAutoOpeneds = []
        return
      }
      nextTick(() => {
        const menu = unref(menuRef)
        if (!menu) {
          return
        }
        const nextOpeneds = unref(defaultOpeneds)
        if (unref(uniqueOpened)) {
          lastAutoOpeneds
            .filter((path) => !nextOpeneds.includes(path))
            .forEach((path) => {
              try {
                menu.close(path)
              } catch (error) {
                warnMenuOpenError('close', path, error)
              }
            })
        }
        nextOpeneds.forEach((path) => {
          try {
            menu.open(path)
          } catch (error) {
            warnMenuOpenError('open', path, error)
          }
        })
        lastAutoOpeneds = [...nextOpeneds]
      })
    }

    watch(
      () =>
        [
          unref(menuMode),
          unref(collapse),
          unref(defaultOpeneds).join(','),
          unref(uniqueOpened)
        ] as const,
      syncDefaultOpeneds,
      {
        flush: 'post',
        immediate: true
      }
    )

    const scrollActiveHorizontalMenuIntoView = () => {
      if (unref(menuMode) !== 'horizontal') {
        return
      }
      nextTick(() => {
        const wrapper = unref(menuWrapRef)
        const activeItem = wrapper?.querySelector<HTMLElement>(
          '.el-menu--horizontal > .el-menu-item.is-active,.el-menu--horizontal > .el-sub-menu.is-active'
        )
        if (!wrapper || !activeItem) {
          return
        }
        const wrapperRect = wrapper.getBoundingClientRect()
        const itemRect = activeItem.getBoundingClientRect()
        if (itemRect.left < wrapperRect.left) {
          wrapper.scrollLeft -= wrapperRect.left - itemRect.left
        } else if (itemRect.right > wrapperRect.right) {
          wrapper.scrollLeft += itemRect.right - wrapperRect.right
        }
      })
    }

    watch(
      () => [unref(activeMenu), unref(menuMode), unref(routers)] as const,
      scrollActiveHorizontalMenuIntoView,
      {
        flush: 'post',
        immediate: true
      }
    )

    const openHorizontalOverflowMenu = (event: Event) => {
      if (unref(menuMode) !== 'horizontal') {
        return
      }
      const target = event.target as HTMLElement | null
      const trigger = target?.closest<HTMLElement>('.el-sub-menu__hide-arrow')
      if (!trigger) {
        return
      }
      if (event.type === 'click') {
        event.preventDefault()
        event.stopPropagation()
      }
      const rect = trigger.getBoundingClientRect()
      horizontalOverflowRoutes.value = getHorizontalOverflowRoutes()
      horizontalOverflowStyle.value = {
        left: `${rect.left}px`,
        minWidth: '200px',
        position: 'fixed',
        right: 'auto',
        top: `${rect.bottom + 6}px`,
        zIndex: '5000'
      }
      horizontalOverflowOpened.value = true
    }

    onMounted(() => {
      const wrapper = unref(menuWrapRef)
      wrapper?.addEventListener('click', openHorizontalOverflowMenu, true)
      wrapper?.addEventListener('mouseover', openHorizontalOverflowMenu, true)
    })

    onBeforeUnmount(() => {
      const wrapper = unref(menuWrapRef)
      wrapper?.removeEventListener('click', openHorizontalOverflowMenu, true)
      wrapper?.removeEventListener('mouseover', openHorizontalOverflowMenu, true)
    })

    const menuSelect = (index: string) => {
      horizontalOverflowOpened.value = false
      if (props.menuSelect) {
        props.menuSelect(index)
      }
      // 自定义事件
      if (isUrl(index)) {
        window.open(index)
      } else {
        const routeInfo = props.rootOnly
          ? getRootMenuRoute(permissionStore.getRouters, index)
          : findRouteByPath(permissionStore.getRouters, index)
        const link = routeInfo?.route.meta?.link
        if (typeof link === 'string') {
          window.open(link)
          return
        }
        const targetPath =
          props.rootOnly && routeInfo?.route.children?.length
            ? (routeInfo.route.redirect as string) ||
              getFirstChildPath(routeInfo.route, routeInfo.fullPath)
            : index

        if (targetPath) {
          const targetRouteInfo = findRouteByPath(permissionStore.getRouters, targetPath)
          const targetLocation = createRouteLocation(
            targetPath,
            targetRouteInfo?.route.meta,
            targetRouteInfo?.route.name
          )
          if (resolve(targetLocation).fullPath === unref(currentRoute).fullPath) {
            return
          }
          push(targetLocation)
        }
      }
    }

    const renderMenuWrap = () => {
      if (isHeaderNavLayout(unref(layout)) || unref(menuMode) === 'horizontal') {
        return renderMenu()
      } else {
        return <ElScrollbar>{renderMenu()}</ElScrollbar>
      }
    }

    const renderMenu = () => {
      return (
        <ElMenu
          ref={menuRef}
          defaultActive={unref(activeMenu)}
          defaultOpeneds={unref(defaultOpeneds)}
          mode={unref(menuMode)}
          menuTrigger={props.rootOnly && unref(menuMode) === 'horizontal' ? 'click' : 'hover'}
          collapse={
            unref(menuMode) === 'horizontal' || isTwoColumnLayout(unref(layout))
              ? false
              : unref(collapse)
          }
          uniqueOpened={unref(menuMode) === 'horizontal' ? false : unref(uniqueOpened)}
          backgroundColor={unref(menuBgColor)}
          ellipsis={unref(menuMode) === 'horizontal' ? true : undefined}
          textColor={unref(menuTextColor)}
          activeTextColor={unref(menuActiveTextColor)}
          popperClass={
            unref(menuMode) === 'vertical'
              ? `${prefixCls}-popper--vertical ${prefixCls}-popper--${props.theme}`
              : `${prefixCls}-popper--horizontal ${prefixCls}-popper--${props.theme}`
          }
          onSelect={menuSelect}
        >
          {{
            default: () => {
              const { renderMenuItem } = useRenderMenuItem()
              return renderMenuItem(unref(routers))
            }
          }}
        </ElMenu>
      )
    }

    const getOverflowMenuIndex = (route: AppRouteRecordRaw): string => {
      const fullPath = isUrl(route.path) ? route.path : pathResolve('/', route.path)
      return isUrl(fullPath)
        ? fullPath
        : resolveDynamicPath(fullPath, route.meta?.params as Record<string, any>)
    }

    const isVisibleElement = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden'
      )
    }

    const getVisibleHorizontalRootCount = () => {
      const menu = unref(menuWrapRef)?.querySelector<HTMLElement>('.el-menu--horizontal')
      if (!menu) {
        return 0
      }
      return Array.from(menu.children).filter((item) => {
        const element = item as HTMLElement
        return (
          element.matches('.el-menu-item,.el-sub-menu') &&
          !element.classList.contains('el-sub-menu__hide-arrow') &&
          isVisibleElement(element)
        )
      }).length
    }

    const getHorizontalOverflowRoutes = () => {
      const visibleRoutes = unref(routers).filter((route) => !route.meta?.hidden)
      const menu = unref(menuWrapRef)?.querySelector<HTMLElement>('.el-menu--horizontal')
      const moreMenu = menu?.querySelector(':scope > .el-sub-menu.el-sub-menu__hide-arrow')
      if (!moreMenu) {
        return []
      }
      const visibleRootCount = getVisibleHorizontalRootCount()
      return visibleRoutes.slice(Math.min(visibleRootCount, visibleRoutes.length))
    }

    const renderHorizontalOverflowFallback = () => {
      if (!props.rootOnly || unref(menuMode) !== 'horizontal') {
        return undefined
      }
      const overflowRoutes = unref(horizontalOverflowRoutes)
      if (!overflowRoutes.length) {
        return undefined
      }
      return (
        <div
          class={[
            'el-popper is-pure is-light el-tooltip',
            `${prefixCls}-overflow-fallback`,
            {
              'is-open': unref(horizontalOverflowOpened)
            },
            `${prefixCls}-popper--horizontal`,
            `${prefixCls}-popper--${props.theme}`
          ]}
          style={unref(horizontalOverflowStyle)}
          onMouseleave={() => {
            horizontalOverflowOpened.value = false
          }}
        >
          <ul class="el-menu el-menu--popup">
            {overflowRoutes.map((route) => (
              <li
                key={getOverflowMenuIndex(route)}
                class="el-menu-item"
                role="menuitem"
                onClick={() => menuSelect(getOverflowMenuIndex(route))}
              >
                {route.meta?.title ? t(route.meta.title as string) : ''}
              </li>
            ))}
          </ul>
        </div>
      )
    }

    return () => (
      <div
        id={prefixCls}
        ref={menuWrapRef}
        class={[
          `${prefixCls} ${prefixCls}__${unref(menuMode)}`,
          `${prefixCls}--${props.theme}`,
          'h-[100%] overflow-hidden flex-col bg-[var(--left-menu-bg-color)]',
          {
            'w-[var(--left-menu-min-width)]':
              unref(collapse) &&
              !isTwoColumnLayout(unref(layout)) &&
              unref(menuMode) !== 'horizontal',
            'w-[var(--left-menu-max-width)]':
              !unref(collapse) &&
              !isTwoColumnLayout(unref(layout)) &&
              unref(menuMode) !== 'horizontal'
          }
        ]}
        style={{
          backgroundColor: unref(menuBgColor)
        }}
      >
        {renderMenuWrap()}
        {renderHorizontalOverflowFallback()}
      </div>
    )
  }
})
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-menu;

.#{$prefix-cls} {
  position: relative;
  transition: width var(--transition-time-02);

  :deep(.#{$elNamespace}-menu) {
    width: 100% !important;
    border-right: none;

    // 设置选中时子标题的颜色
    .is-active {
      & > .#{$elNamespace}-sub-menu__title {
        color: var(--left-menu-text-active-color) !important;
      }
    }

    // 设置子菜单悬停的高亮和背景色
    .#{$elNamespace}-sub-menu__title,
    .#{$elNamespace}-menu-item {
      &:hover {
        color: var(--left-menu-text-active-color) !important;
        background-color: var(--left-menu-bg-color) !important;
      }
    }

    // 设置选中时的高亮背景和高亮颜色
    .#{$elNamespace}-menu-item.is-active {
      color: var(--left-menu-text-active-color) !important;
      background-color: var(--left-menu-bg-active-color) !important;

      &:hover {
        background-color: var(--left-menu-bg-active-color) !important;
      }
    }

    .#{$elNamespace}-menu-item.is-active {
      position: relative;
    }

    // 设置子菜单的背景颜色
    .#{$elNamespace}-menu {
      .#{$elNamespace}-sub-menu__title,
      .#{$elNamespace}-menu-item:not(.is-active) {
        background-color: var(--left-menu-bg-light-color) !important;
      }
    }
  }

  // 折叠时的最小宽度
  :deep(.#{$elNamespace}-menu--collapse) {
    width: var(--left-menu-min-width);

    & > .is-active,
    & > .is-active > .#{$elNamespace}-sub-menu__title {
      position: relative;
      background-color: var(--left-menu-collapse-bg-active-color) !important;
    }
  }

  // 折叠动画的时候，就需要把文字给隐藏掉
  :deep(.horizontal-collapse-transition) {
    // transition: 0s width ease-in-out, 0s padding-left ease-in-out, 0s padding-right ease-in-out !important;
    .#{$prefix-cls}__title {
      display: none;
    }
  }

  // 垂直菜单
  &__vertical {
    :deep(.#{$elNamespace}-menu--vertical) {
      &:not(.#{$elNamespace}-menu--collapse) .#{$elNamespace}-sub-menu__title,
      .#{$elNamespace}-menu-item {
        padding-right: 0;
      }
    }
  }

  // 水平菜单
  &__horizontal {
    height: calc(var(--top-tool-height)) !important;
    min-width: 0;
    flex-shrink: 1;
    overflow: hidden;

    :deep(.#{$elNamespace}-menu--horizontal) {
      height: calc(var(--top-tool-height));
      min-width: 100%;
      border-bottom: none;
      // 重新设置底部高亮颜色
      & > .#{$elNamespace}-sub-menu.is-active {
        .#{$elNamespace}-sub-menu__title {
          border-bottom-color: var(--el-color-primary) !important;
        }
      }

      .#{$elNamespace}-menu-item.is-active {
        position: relative;

        &::after {
          display: none !important;
        }
      }

      .#{$prefix-cls}__title {
        /* stylelint-disable-next-line */
        max-height: calc(var(--top-tool-height) - 2px) !important;
        /* stylelint-disable-next-line */
        line-height: calc(var(--top-tool-height) - 2px);
      }
    }
  }

  &--header {
    :deep(.#{$elNamespace}-menu) {
      .is-active {
        & > .#{$elNamespace}-sub-menu__title {
          color: var(--el-color-primary) !important;
        }
      }

      .#{$elNamespace}-sub-menu__title,
      .#{$elNamespace}-menu-item {
        &:hover {
          color: var(--el-color-primary) !important;
          background-color: var(--top-header-hover-color) !important;
        }
      }

      .#{$elNamespace}-menu-item.is-active {
        color: var(--el-color-primary) !important;
        background-color: var(--top-header-bg-color) !important;

        &:hover {
          background-color: var(--top-header-hover-color) !important;
        }
      }

      .#{$elNamespace}-menu {
        .#{$elNamespace}-sub-menu__title,
        .#{$elNamespace}-menu-item:not(.is-active) {
          background-color: var(--top-header-bg-color) !important;
        }
      }
    }
  }
}

.#{$prefix-cls}-overflow-fallback {
  position: fixed;
  top: calc(var(--top-tool-height) + 6px);
  right: clamp(16px, 38vw, 640px);
  z-index: 5000;
  display: none;
  min-width: 200px;

  .#{$elNamespace}-menu {
    border: none;
  }
}

.#{$prefix-cls}__horizontal:has(.#{$elNamespace}-sub-menu__hide-arrow:hover)
  > .#{$prefix-cls}-overflow-fallback,
.#{$prefix-cls}-overflow-fallback:hover,
.#{$prefix-cls}-overflow-fallback.is-open {
  display: block;
}
</style>

<style lang="scss">
$prefix-cls: #{$namespace}-menu-popper;

.#{$prefix-cls}--vertical,
.#{$prefix-cls}--horizontal {
  // 设置选中时子标题的颜色
  .is-active {
    & > .el-sub-menu__title {
      color: var(--left-menu-text-active-color) !important;
    }
  }

  // 设置子菜单悬停的高亮和背景色
  .el-sub-menu__title,
  .el-menu-item {
    &:hover {
      color: var(--left-menu-text-active-color) !important;
      background-color: var(--left-menu-bg-color) !important;
    }
  }

  // 设置选中时的高亮背景
  .el-menu-item.is-active {
    position: relative;
    background-color: var(--left-menu-bg-active-color) !important;

    &:hover {
      background-color: var(--left-menu-bg-active-color) !important;
    }
  }
}

.#{$prefix-cls}--header {
  .is-active {
    & > .el-sub-menu__title {
      color: var(--el-color-primary) !important;
    }
  }

  .el-sub-menu__title,
  .el-menu-item {
    &:hover {
      color: var(--el-color-primary) !important;
      background-color: var(--top-header-hover-color) !important;
    }
  }

  .el-menu-item.is-active {
    background-color: var(--top-header-bg-color) !important;

    &:hover {
      background-color: var(--top-header-hover-color) !important;
    }
  }
}
</style>
