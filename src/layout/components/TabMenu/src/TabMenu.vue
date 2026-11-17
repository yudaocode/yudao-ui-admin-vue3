<script lang="tsx">
import { usePermissionStore } from '@/store/modules/permission'
import { useAppStore } from '@/store/modules/app'

import { ElScrollbar } from 'element-plus'
import { Icon } from '@/components/Icon'
import { Menu } from '@/layout/components/Menu'
import { pathResolve } from '@/utils/routerHelper'
import { cloneDeep } from 'lodash-es'
import { filterMenusPath, initTabMap, tabPathMap } from './helper'
import { useDesign } from '@/hooks/web/useDesign'
import { isUrl } from '@/utils/is'
import { createRouteLocation } from '@/utils/routeParams'
import { getRouteTitle } from '@/utils/routeTitle'
import { getRootPath, isHeaderMixedNavLayout, isTwoColumnLayout } from '@/utils/layout'
import { getRootMenuRoute, normalizeMenuTargetPath } from '@/layout/components/Menu/src/menuRoute'

const { getPrefixCls, variables } = useDesign()

const prefixCls = getPrefixCls('tab-menu')

export default defineComponent({
  name: 'TabMenu',
  setup() {
    const { push, currentRoute, resolve } = useRouter()

    const { t } = useI18n()

    const appStore = useAppStore()

    const collapse = computed(() => appStore.getCollapse)

    const fixedMenu = computed(() => appStore.getFixedMenu)

    const layout = computed(() => appStore.getLayout)

    const headerMixed = computed(() => isHeaderMixedNavLayout(unref(layout)))

    const twoColumn = computed(() => isTwoColumnLayout(unref(layout)))

    const permissionStore = usePermissionStore()

    const routers = computed(() => permissionStore.getRouters)

    const currentMenuPath = computed(() =>
      normalizeMenuTargetPath(
        (unref(currentRoute).meta.activeMenu as string) || unref(currentRoute).path
      )
    )

    const activeRootInfo = computed(() => {
      const targetPath =
        unref(headerMixed) && permissionStore.getMenuRootPath
          ? permissionStore.getMenuRootPath
          : unref(currentMenuPath)
      return getRootMenuRoute(unref(routers), targetPath)
    })

    const rootPath = computed(
      () => unref(activeRootInfo)?.fullPath || getRootPath(unref(currentMenuPath))
    )

    const activeRootRoute = computed(() => unref(activeRootInfo)?.route)

    const tabRouters = computed(() => {
      const sourceRoutes = unref(headerMixed)
        ? unref(activeRootRoute)?.children || []
        : unref(routers)
      return sourceRoutes.filter((v) => !v?.meta?.hidden)
    })

    const getTabParentPath = () => (unref(headerMixed) ? unref(rootPath) : '')

    const setCollapse = () => {
      appStore.setCollapse(!unref(collapse))
    }

    watch(
      () => routers.value,
      (routers: AppRouteRecordRaw[]) => {
        initTabMap(routers)
        filterMenusPath(routers, routers)
      },
      {
        immediate: true
      }
    )

    const showTitle = ref(true)

    // 展开后延时显示标题的定时器；每次切换先清除，避免快速展开又收起时旧定时器在收起态重新显示标题
    let showTitleTimer: ReturnType<typeof setTimeout> | undefined

    const clearShowTitleTimer = () => {
      if (showTitleTimer !== undefined) {
        clearTimeout(showTitleTimer)
        showTitleTimer = undefined
      }
    }

    watch(
      () => collapse.value,
      (collapse: boolean, oldCollapse?: boolean) => {
        clearShowTitleTimer()
        // 首次（immediate）直接同步，避免挂载时新增延时回调
        if (!collapse && oldCollapse !== undefined) {
          showTitleTimer = setTimeout(() => {
            showTitleTimer = undefined
            showTitle.value = !collapse
          }, 200)
        } else {
          showTitle.value = !collapse
        }
      },
      {
        immediate: true
      }
    )

    onBeforeUnmount(clearShowTitleTimer)

    // 是否显示菜单
    const showMenu = ref(unref(fixedMenu) || unref(headerMixed) || unref(twoColumn))

    // tab高亮
    const tabActive = ref('')

    const hasExtraMenu = computed(() => permissionStore.getMenuTabRouters.length > 0)

    const getFullTabPath = (route: AppRouteRecordRaw) => pathResolve(getTabParentPath(), route.path)

    const isPathInTab = (currentPath: string, route: AppRouteRecordRaw) => {
      const tabPath = getFullTabPath(route)
      return currentPath === tabPath || currentPath.startsWith(`${tabPath}/`)
    }

    // 以 / 开头的子路由由 vue-router 按绝对路径注册，完整路径不以所属一级菜单为前缀，前缀匹配无法命中；
    // 非 header-mixed-nav（一级为顶层菜单）时，按菜单树定位其所属一级菜单作为兜底。
    // 仅在没有任何一级菜单前缀命中、树中命中且当前路径不在该一级菜单路径之下时生效，前缀能命中的原有场景不受影响
    const absoluteDescendantRootTab = computed((): AppRouteRecordRaw | undefined => {
      if (unref(headerMixed)) {
        return undefined
      }
      const currentPath = unref(currentMenuPath)
      if (unref(tabRouters).some((route) => isPathInTab(currentPath, route))) {
        return undefined
      }
      const rootInfo = getRootMenuRoute(unref(routers), currentPath)
      if (
        !rootInfo ||
        currentPath === rootInfo.fullPath ||
        currentPath.startsWith(`${rootInfo.fullPath}/`)
      ) {
        return undefined
      }
      return unref(tabRouters).find((route) => route === rootInfo.route)
    })

    const getVisibleChildren = (route: AppRouteRecordRaw): AppRouteRecordRaw[] =>
      (route.children || []).filter((child) => !child.meta?.hidden)

    const shouldShowExtraMenu = (route: AppRouteRecordRaw): boolean => {
      const children = getVisibleChildren(route)
      if (!children.length) {
        return false
      }
      return unref(headerMixed) || !!route.meta?.alwaysShow || children.length > 1
    }

    const isSameMenuRouters = (left: AppRouteRecordRaw[], right: AppRouteRecordRaw[]): boolean => {
      return (
        left.length === right.length &&
        left.every(
          (route, index) => route.path === right[index]?.path && route.name === right[index]?.name
        )
      )
    }

    const setExtraMenuRouters = (routers: AppRouteRecordRaw[]) => {
      if (isSameMenuRouters(permissionStore.getMenuTabRouters, routers)) {
        return
      }
      permissionStore.setMenuTabRouters(routers)
    }

    const buildExtraMenuRouters = (children: AppRouteRecordRaw[], parentPath: string) =>
      cloneDeep(children).map((v) => {
        v.path = pathResolve(parentPath, v.path)
        return v
      })

    const getTabItem = (route: AppRouteRecordRaw): AppRouteRecordRaw => {
      const fullTabPath = getFullTabPath(route)
      const children = getVisibleChildren(route)
      if (shouldShowExtraMenu(route) || !children.length) {
        return { ...route, path: fullTabPath }
      }
      return {
        ...children[0],
        path: pathResolve(fullTabPath, children[0].path)
      } as AppRouteRecordRaw
    }

    const isCurrentRouteInTab = (tabPath: string) => {
      const currentPath = unref(currentMenuPath)
      if (unref(headerMixed)) {
        return currentPath === tabPath || currentPath.startsWith(`${tabPath}/`)
      }
      return !!tabPathMap[tabPath]?.includes(currentPath)
    }

    const syncTabMenusByRoute = () => {
      if (!unref(fixedMenu) && !unref(headerMixed) && !unref(twoColumn)) {
        return
      }

      const currentPath = unref(currentMenuPath)
      const activeTab =
        unref(tabRouters).find((route) => isPathInTab(currentPath, route)) ||
        unref(absoluteDescendantRootTab)

      if (!activeTab || !shouldShowExtraMenu(activeTab)) {
        tabActive.value = activeTab ? getFullTabPath(activeTab) : ''
        showMenu.value = unref(fixedMenu) || unref(headerMixed) || unref(twoColumn)
        setExtraMenuRouters([])
        return
      }

      const activeTabPath = getFullTabPath(activeTab)
      tabActive.value = activeTabPath
      showMenu.value = true
      setExtraMenuRouters(buildExtraMenuRouters(getVisibleChildren(activeTab), activeTabPath))
    }

    watch(
      () =>
        [
          unref(currentRoute).path,
          permissionStore.getMenuRootPath,
          unref(tabRouters),
          unref(fixedMenu),
          unref(headerMixed),
          unref(twoColumn)
        ] as const,
      syncTabMenusByRoute,
      {
        immediate: true
      }
    )

    // tab点击事件
    const tabClick = (item: AppRouteRecordRaw) => {
      const link = item.meta?.link
      if (typeof link === 'string') {
        window.open(link)
        return
      }
      if (isUrl(item.path)) {
        window.open(item.path)
        return
      }
      const newPath = normalizeMenuTargetPath(item.path)
      const oldPath = unref(tabActive)
      tabActive.value = newPath
      const children = getVisibleChildren(item)
      if (children.length) {
        if (newPath === oldPath || !unref(showMenu)) {
          showMenu.value =
            unref(fixedMenu) || unref(headerMixed) || unref(twoColumn) ? true : !unref(showMenu)
        }
        if (unref(showMenu)) {
          setExtraMenuRouters(buildExtraMenuRouters(children, unref(tabActive)))
        }
      } else {
        const targetLocation = createRouteLocation(item.path, item.meta, item.name)
        if (resolve(targetLocation).fullPath !== unref(currentRoute).fullPath) {
          push(targetLocation)
        }
        setExtraMenuRouters([])
        showMenu.value = false
      }
    }

    // 扩展菜单的二级标题：当前展开的一级入口标题
    const extraMenuTitle = computed(() => {
      const activeTab = unref(tabRouters).find(
        (route) => getFullTabPath(route) === unref(tabActive)
      )
      return activeTab ? getRouteTitle(activeTab.meta) : ''
    })

    // 设置高亮
    const isActive = (currentPath: string) => {
      const { path } = unref(currentRoute)
      if (isCurrentRouteInTab(currentPath) || tabPathMap[currentPath]?.includes(path)) {
        return true
      }
      const rootTab = unref(absoluteDescendantRootTab)
      return !!rootTab && getFullTabPath(rootTab) === currentPath
    }

    const mouseleave = () => {
      if (!unref(showMenu) || unref(fixedMenu) || unref(headerMixed) || unref(twoColumn)) return
      showMenu.value = false
    }

    return () => (
      <aside
        id={`${variables.namespace}-menu`}
        class={[
          prefixCls,
          'relative bg-[var(--left-menu-bg-color)] layout-border__right',
          {
            'w-[var(--tab-menu-max-width)]': !unref(collapse),
            'w-[var(--tab-menu-min-width)]': unref(collapse),
            'is-collapsed': unref(collapse)
          }
        ]}
        onMouseleave={mouseleave}
      >
        <ElScrollbar class="!h-[calc(100%-var(--tab-menu-collapse-height))]">
          {/* 一级导航语义地标；顶部混合导航下此列为二级入口，不重复“主导航”名称 */}
          <nav aria-label={unref(headerMixed) ? undefined : t('layout.mainNavigation')}>
            {() => {
              return unref(tabRouters).map((v) => {
                const fullTabPath = getFullTabPath(v)
                const item = getTabItem(v)
                const active = isActive(fullTabPath)
                // 原生 button，可键盘聚焦、Enter/Space 触发；
                // 收起时只显示图标，以 aria-label 提供可访问名称，并以 title 悬停提示标题
                // （展开时标题已可见，不重复提示）；以完整路径作 key，重排时焦点不错位到其它路由
                return (
                  <button
                    key={fullTabPath}
                    type="button"
                    aria-label={getRouteTitle(item.meta)}
                    title={unref(showTitle) ? undefined : getRouteTitle(item.meta)}
                    aria-current={active ? 'true' : undefined}
                    class={[
                      `${prefixCls}__item`,
                      'block w-full text-center text-12px relative py-12px cursor-pointer',
                      {
                        'is-active': active
                      }
                    ]}
                    onClick={() => {
                      tabClick(item)
                    }}
                  >
                    {/* button 内只放 phrasing content：block span 代替原 div / p（全局 var.css 已将 p 外边距置 0） */}
                    <span class="block">
                      <Icon icon={item?.meta?.icon}></Icon>
                    </span>
                    {!unref(showTitle) ? undefined : (
                      <span class={`${prefixCls}__title block mt-5px break-words px-2px`}>
                        {getRouteTitle(item.meta)}
                      </span>
                    )}
                  </button>
                )
              })
            }}
          </nav>
        </ElScrollbar>
        <button
          type="button"
          aria-expanded={!unref(collapse)}
          aria-label={t(unref(collapse) ? 'layout.expandNavigation' : 'layout.collapseNavigation')}
          class={[
            `${prefixCls}--collapse`,
            'block w-full text-center h-[var(--tab-menu-collapse-height)] leading-[var(--tab-menu-collapse-height)] cursor-pointer'
          ]}
          onClick={setCollapse}
        >
          <Icon icon={unref(collapse) ? 'ep:d-arrow-right' : 'ep:d-arrow-left'}></Icon>
        </button>
        {unref(hasExtraMenu) ? (
          <Menu
            split={false}
            menus={permissionStore.getMenuTabRouters}
            secondaryTitle={unref(extraMenuTitle)}
            mode="vertical"
            class={[
              '!absolute top-0 z-11',
              {
                '!left-[var(--tab-menu-min-width)]': unref(collapse),
                '!left-[var(--tab-menu-max-width)]': !unref(collapse),
                '!w-[var(--left-menu-max-width)] border-r-1 border-r-solid border-[var(--el-border-color)]':
                  unref(showMenu) || unref(fixedMenu),
                '!w-0': !unref(showMenu) && !unref(fixedMenu)
              }
            ]}
            style="transition: width var(--transition-time-02), left var(--transition-time-02);"
          ></Menu>
        ) : undefined}
      </aside>
    )
  }
})
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-tab-menu;

.#{$prefix-cls} {
  transition: all var(--transition-time-02);

  // 原生 button 默认样式重置：只重置原子类未设置的属性（不动 font-size、上下内边距、行高原子类）
  &__item,
  &--collapse {
    padding-inline: 0;
    margin: 0;
    font-family: inherit;
    border: 0;

    &:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: -2px;
    }
  }

  &__item {
    line-height: inherit;
    color: var(--left-menu-text-color);
    background-color: transparent;
    transition: all var(--transition-time-02);

    &:hover {
      color: var(--left-menu-text-active-color);
      // background-color: var(--left-menu-bg-active-color);
    }
  }

  &--collapse {
    padding-block: 0;
    font-size: inherit;
    color: var(--left-menu-text-color);
    background-color: var(--left-menu-bg-light-color);
  }

  .is-active {
    color: var(--left-menu-text-active-color);
    background-color: var(--left-menu-bg-active-color);
  }

  // 一级入口 pill + 选中主色指示条：
  // 用伪元素绘制，按钮尺寸与点击区域不变；颜色全部取自菜单主题变量，已保存的自定义主题继续生效
  // 展开宽度 72px 时 pill 宽 56px
  &__item {
    isolation: isolate;

    &::before {
      position: absolute;
      z-index: -1;
      border-radius: 10px;
      content: '';
      transition: background-color var(--transition-time-02);
      inset: 4px 8px;
    }

    &:hover::before {
      background-color: color-mix(in srgb, var(--left-menu-text-active-color) 10%, transparent);
    }

    &.is-active {
      font-weight: 600;
      background-color: transparent;

      &::before {
        background-color: var(--left-menu-bg-active-color);
      }

      &::after {
        position: absolute;
        top: 12px;
        bottom: 12px;
        left: 0;
        width: 3px;
        background-color: var(--el-color-primary);
        border-radius: 0 3px 3px 0;
        content: '';
      }
    }
  }

  // 收起（30px）时 pill 内缩减小，避免挤占图标
  &.is-collapsed .#{$prefix-cls}__item::before {
    inset: 4px 3px;
  }
}
</style>
