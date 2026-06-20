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

    watch(
      () => collapse.value,
      (collapse: boolean) => {
        if (!collapse) {
          setTimeout(() => {
            showTitle.value = !collapse
          }, 200)
        } else {
          showTitle.value = !collapse
        }
      }
    )

    // 是否显示菜单
    const showMenu = ref(unref(fixedMenu) || unref(headerMixed) || unref(twoColumn))

    // tab高亮
    const tabActive = ref('')

    const hasExtraMenu = computed(() => permissionStore.getMenuTabRouters.length > 0)

    const getFullTabPath = (route: AppRouteRecordRaw) => pathResolve(getTabParentPath(), route.path)

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
      const activeTab = unref(tabRouters).find((route) => {
        const tabPath = getFullTabPath(route)
        return currentPath === tabPath || currentPath.startsWith(`${tabPath}/`)
      })

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

    // 设置高亮
    const isActive = (currentPath: string) => {
      const { path } = unref(currentRoute)
      if (isCurrentRouteInTab(currentPath) || tabPathMap[currentPath]?.includes(path)) {
        return true
      }
      return false
    }

    const mouseleave = () => {
      if (!unref(showMenu) || unref(fixedMenu) || unref(headerMixed) || unref(twoColumn)) return
      showMenu.value = false
    }

    return () => (
      <div
        id={`${variables.namespace}-menu`}
        class={[
          prefixCls,
          'relative bg-[var(--left-menu-bg-color)] layout-border__right',
          {
            'w-[var(--tab-menu-max-width)]': !unref(collapse),
            'w-[var(--tab-menu-min-width)]': unref(collapse)
          }
        ]}
        onMouseleave={mouseleave}
      >
        <ElScrollbar class="!h-[calc(100%-var(--tab-menu-collapse-height))]">
          <div>
            {() => {
              return unref(tabRouters).map((v) => {
                const fullTabPath = getFullTabPath(v)
                const item = getTabItem(v)
                return (
                  <div
                    class={[
                      `${prefixCls}__item`,
                      'text-center text-12px relative py-12px cursor-pointer',
                      {
                        'is-active': isActive(fullTabPath)
                      }
                    ]}
                    onClick={() => {
                      tabClick(item)
                    }}
                  >
                    <div>
                      <Icon icon={item?.meta?.icon}></Icon>
                    </div>
                    {!unref(showTitle) ? undefined : (
                      <p class="mt-5px break-words px-2px">{t(item.meta?.title)}</p>
                    )}
                  </div>
                )
              })
            }}
          </div>
        </ElScrollbar>
        <div
          class={[
            `${prefixCls}--collapse`,
            'text-center h-[var(--tab-menu-collapse-height)] leading-[var(--tab-menu-collapse-height)] cursor-pointer'
          ]}
          onClick={setCollapse}
        >
          <Icon icon={unref(collapse) ? 'ep:d-arrow-right' : 'ep:d-arrow-left'}></Icon>
        </div>
        {unref(hasExtraMenu) ? (
          <Menu
            split={false}
            menus={permissionStore.getMenuTabRouters}
            mode="vertical"
            class={[
              '!absolute top-0 z-11',
              {
                '!left-[var(--tab-menu-min-width)]': unref(collapse),
                '!left-[var(--tab-menu-max-width)]': !unref(collapse),
                '!w-[var(--left-menu-max-width)]': unref(showMenu) || unref(fixedMenu),
                '!w-0': !unref(showMenu) && !unref(fixedMenu)
              }
            ]}
            style="transition: width var(--transition-time-02), left var(--transition-time-02);"
          ></Menu>
        ) : undefined}
      </div>
    )
  }
})
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-tab-menu;

.#{$prefix-cls} {
  transition: all var(--transition-time-02);

  &__item {
    color: var(--left-menu-text-color);
    transition: all var(--transition-time-02);

    &:hover {
      color: var(--left-menu-text-active-color);
      // background-color: var(--left-menu-bg-active-color);
    }
  }

  &--collapse {
    color: var(--left-menu-text-color);
    background-color: var(--left-menu-bg-light-color);
  }

  .is-active {
    color: var(--left-menu-text-active-color);
    background-color: var(--left-menu-bg-active-color);
  }
}
</style>
