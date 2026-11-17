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
import { getRouteTitle } from '@/utils/routeTitle'
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
    },
    // 二级菜单标题：未传时，split（mixed-nav 左侧）取当前一级菜单标题，其它为空不显示
    secondaryTitle: {
      type: String,
      default: undefined
    }
  },
  setup(props) {
    const { t } = useI18n()

    const appStore = useAppStore()

    const layout = computed(() => appStore.getLayout)

    const { push, currentRoute, resolve } = useRouter()

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
              title: firstVisibleChild.meta?.title,
              // 标题来源随标题一起复制，后端菜单原文不被当作语言 key 翻译
              titleSource: firstVisibleChild.meta?.titleSource
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

    // 二级菜单标题：标题来源与顶栏一级菜单一致（含首个可见子项回退、后端原文）
    const secondaryTitle = computed(() => {
      if (props.secondaryTitle !== undefined) {
        return props.secondaryTitle
      }
      if (!props.split) {
        return ''
      }
      const path = (unref(currentRoute).meta.activeMenu as string) || unref(currentRoute).path
      const rootRoute = getRootMenuRoute(permissionStore.getRouters, path)?.route
      return rootRoute ? getRouteTitle(getRootOnlyMenuRoute(rootRoute).meta) : ''
    })

    // 仅垂直且未折叠时显示（双栏布局的扩展菜单不折叠，与 ElMenu 的 collapse 规则一致）
    const showSecondaryTitle = computed(
      () =>
        !!unref(secondaryTitle) &&
        unref(menuMode) === 'vertical' &&
        (isTwoColumnLayout(unref(layout)) || !unref(collapse))
    )

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
        return (
          <ElScrollbar class={{ '!h-[calc(100%-46px)]': unref(showSecondaryTitle) }}>
            {renderMenu()}
          </ElScrollbar>
        )
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
                class={[
                  'el-menu-item',
                  { 'is-active': getOverflowMenuIndex(route) === unref(activeMenu) }
                ]}
                role="menuitem"
                onClick={() => menuSelect(getOverflowMenuIndex(route))}
              >
                {getRouteTitle(route.meta)}
              </li>
            ))}
          </ul>
        </div>
      )
    }

    return () => (
      <nav
        id={prefixCls}
        ref={menuWrapRef}
        aria-label={props.rootOnly ? t('layout.mainNavigation') : undefined}
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
        {unref(showSecondaryTitle) ? (
          <div class={`${prefixCls}__secondary-title`} title={unref(secondaryTitle)}>
            {unref(secondaryTitle)}
          </div>
        ) : undefined}
        {renderMenuWrap()}
        {renderHorizontalOverflowFallback()}
      </nav>
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

// 二级菜单标题：46px 标题行 + 主色圆点
.#{$prefix-cls}__secondary-title {
  height: 46px;
  padding: 0 18px;
  overflow: hidden;
  font-size: 13px;
  font-weight: 700;
  line-height: 46px;
  color: var(--logo-title-text-color);
  text-overflow: ellipsis;
  white-space: nowrap;
  border-bottom: 1px solid var(--layout-border-color);

  &::before {
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-right: 9px;
    vertical-align: 1px;
    background-color: var(--el-color-primary);
    border-radius: 50%;
    content: '';
    box-shadow: 0 0 0 4px var(--el-color-primary-light-9);
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

// 菜单 pill 外观：
// 用伪元素在菜单项内侧绘制圆角底色，菜单项宽度、内边距与点击区域不受 pill 影响；
// 颜色全部取自菜单 / 头部主题变量，已保存的自定义主题继续生效
// 密度（可见 44px、间距 3px 10px）：行高 50px、pill 上下内缩 3px，点击区域仍为整行 50px
.#{$prefix-cls}.#{$prefix-cls}__vertical {
  :deep(.#{$elNamespace}-menu) {
    --el-menu-item-height: 50px;
    --el-menu-sub-item-height: 50px;

    .#{$elNamespace}-sub-menu__title,
    .#{$elNamespace}-menu-item {
      position: relative;
      isolation: isolate;

      &,
      &:hover,
      &.is-active,
      &.is-active:hover {
        background-color: transparent !important;
      }

      &::before {
        position: absolute;
        z-index: -1;
        border-radius: 10px;
        content: '';
        transition: background-color var(--transition-time-02);
        inset: 3px 10px;
      }

      &:hover::before {
        background-color: color-mix(in srgb, var(--left-menu-text-active-color) 10%, transparent);
      }
    }

    .#{$elNamespace}-menu-item.is-active {
      font-weight: 600;

      &::before {
        background-color: var(--left-menu-bg-active-color);
      }
    }

    // 内联子菜单区域保留浅色底；子项 44px 行加 6px 间距，pill 不再上下内缩，避免与间距叠加
    .#{$elNamespace}-menu--inline {
      --el-menu-item-height: 44px;
      --el-menu-sub-item-height: 44px;

      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-top: 6px;
      background-color: var(--left-menu-bg-light-color) !important;

      // 展开动画的 max-height 取不含 padding 的内容高度，过渡期间按 content-box 计算，避免末尾跳动
      &.#{$elNamespace}-collapse-transition-enter-active {
        box-sizing: content-box;
      }

      .#{$elNamespace}-sub-menu__title::before,
      .#{$elNamespace}-menu-item::before {
        inset: 0 10px;
      }
    }
  }

  // 一级菜单上下留白（上游 .el-menu padding 8px 0），内联子菜单不加
  :deep(.#{$elNamespace}-menu--vertical) {
    padding-top: 8px;
    padding-bottom: 8px;
  }

  // 折叠态：一级项图标居中、显示 48px pill（72px 宽 - 2 × 12px），选中沿用收起选中色
  :deep(.#{$elNamespace}-menu--collapse) {
    & > .#{$elNamespace}-menu-item,
    & > .#{$elNamespace}-menu-item .#{$elNamespace}-menu-tooltip__trigger,
    & > .#{$elNamespace}-sub-menu > .#{$elNamespace}-sub-menu__title {
      padding: 0 !important;
      justify-content: center;
    }

    & > .#{$elNamespace}-menu-item::before,
    & > .#{$elNamespace}-sub-menu > .#{$elNamespace}-sub-menu__title::before {
      inset: 3px 12px;
    }

    & > .is-active {
      background-color: transparent !important;
    }

    & > .#{$elNamespace}-menu-item.is-active::before,
    & > .#{$elNamespace}-sub-menu.is-active > .#{$elNamespace}-sub-menu__title::before {
      background-color: var(--left-menu-collapse-bg-active-color);
    }

    // 图标 22px，需覆盖 Icon 的内联字号
    .#{$namespace}-icon {
      flex: none;
      width: 22px;
      height: 22px;
      font-size: 22px !important;

      .iconify {
        font-size: 22px !important;
      }
    }
  }
}

// 水平菜单：pill 上下内缩至 38px，底部高亮线隐藏（边框宽度保留，不改变菜单项宽度与 More 溢出计算）
.#{$prefix-cls}.#{$prefix-cls}__horizontal {
  :deep(.#{$elNamespace}-menu--horizontal) {
    & > .#{$elNamespace}-menu-item,
    & > .#{$elNamespace}-sub-menu > .#{$elNamespace}-sub-menu__title {
      position: relative;
      isolation: isolate;

      &,
      &:hover {
        background-color: transparent !important;
        border-bottom-color: transparent !important;
      }

      &::before {
        position: absolute;
        z-index: -1;
        border-radius: 10px;
        content: '';
        transition: background-color var(--transition-time-02);
        inset: calc((100% - 38px) / 2) 2px;
      }

      &:hover::before {
        background-color: var(--top-header-hover-color);
      }
    }

    & > .#{$elNamespace}-menu-item.is-active,
    & > .#{$elNamespace}-sub-menu.is-active > .#{$elNamespace}-sub-menu__title {
      &,
      &:hover {
        background-color: transparent !important;
        border-bottom-color: transparent !important;
      }

      &::before {
        background-color: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
      }
    }
  }
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

// 折叠菜单的子菜单弹层过长时，限制在视口内并滚动（多级子菜单已 teleported，不会被裁切）
.#{$prefix-cls}--vertical .el-menu--popup {
  max-height: calc(100vh - 16px);
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgb(144 147 153 / 30%);
    border-radius: 4px;
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

// 弹层圆角、边框与阴影，菜单项圆角；背景与文字颜色仍取主题变量
.#{$prefix-cls}--vertical,
.#{$prefix-cls}--horizontal {
  // 弹层菜单项高度 40px，垂直 / 横向弹层统一
  --el-menu-item-height: 40px;
  --el-menu-sub-item-height: 40px;
  --el-menu-horizontal-sub-item-height: 40px;

  overflow: hidden;
  border: 1px solid var(--layout-border-color) !important;
  border-radius: 12px !important;
  box-shadow: var(--layout-shadow) !important;

  .el-menu--popup {
    padding: 6px;
  }

  .el-sub-menu__title,
  .el-menu-item {
    margin: 2px 0;
    border-radius: 8px;
  }
}

// 侧栏折叠弹层的悬停底色（头部主题弹层沿用上方 --header 规则）
.#{$prefix-cls}--vertical:not(.#{$prefix-cls}--header) {
  .el-sub-menu__title,
  .el-menu-item:not(.is-active) {
    &:hover {
      background-color: color-mix(
        in srgb,
        var(--left-menu-text-active-color) 10%,
        transparent
      ) !important;
    }
  }
}

// 横向弹层选中项：600 字重 + 主色浅底；自定义 More 弹层在组件内，需高于组件内 header 选中规则
.#{$prefix-cls}--horizontal .el-menu--popup .el-menu-item.is-active,
.#{$namespace}-menu-overflow-fallback.#{$prefix-cls}--horizontal
  .el-menu.el-menu--popup
  .el-menu-item.is-active {
  &,
  &:hover {
    font-weight: 600;
    background-color: var(--el-color-primary-light-9) !important;
  }
}
</style>
