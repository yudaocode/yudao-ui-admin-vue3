<script lang="ts" setup>
import { computed, nextTick, ref, unref, watch } from 'vue'
import type { RouteLocationNormalizedLoaded, RouteLocationRaw } from 'vue-router'
import { useRouter } from 'vue-router'
import { usePermissionStore } from '@/store/modules/permission'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { useAppStore } from '@/store/modules/app'
import { useI18n } from '@/hooks/web/useI18n'
import { filterAffixTags } from './helper'
import { ContextMenu, ContextMenuExpose } from '@/layout/components/ContextMenu'
import type { ContextMenuSchema } from '@/layout/components/ContextMenu'
import { useDesign } from '@/hooks/web/useDesign'
import { useTemplateRefsList } from '@vueuse/core'
import { ElScrollbar } from 'element-plus'
import { useTagsView } from '@/hooks/web/useTagsView'
import { getRouteTitle } from '@/utils/routeTitle'
import { cloneDeep } from 'lodash-es'

defineOptions({ name: 'TagsView' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('tags-view')

const { t } = useI18n()

const { currentRoute, push, hasRoute } = useRouter()

const { closeAll, closeLeft, closeRight, closeOther, closeCurrent, refreshPage } = useTagsView()

const permissionStore = usePermissionStore()

const routers = computed(() => permissionStore.getRouters)

const tagsViewStore = useTagsViewStore()

const visitedViews = computed(() => tagsViewStore.getVisitedViews)

const affixTagArr = ref<RouteLocationNormalizedLoaded[]>([])

// 当前路由对应的 tag（按 fullPath 匹配，保留同一路径不同 query 的多实例）：工具栏的刷新与“更多”操作以它为准，
// 不受右键其它 tag 的影响；当前页不显示 tag（noTagsView）时为 undefined
const activeTag = computed(() =>
  unref(visitedViews).find((v) => v.fullPath === unref(currentRoute).fullPath)
)

const setSelectTag = tagsViewStore.setSelectedTag

const appStore = useAppStore()

const tagsViewImmerse = computed(() => appStore.getTagsViewImmerse)

const tagsViewIcon = computed(() => appStore.getTagsViewIcon)

// 初始化tag
const initTags = () => {
  affixTagArr.value = filterAffixTags(unref(routers))
  for (const tag of unref(affixTagArr)) {
    // Must have tag name
    if (tag.name) {
      tagsViewStore.addVisitedView(cloneDeep(tag))
    }
  }
}

// 新增tag
const addTags = () => {
  const { name, meta } = unref(currentRoute)
  if (name) {
    setSelectTag(unref(currentRoute))
    // 刷新用的临时 Redirect 页不加 tag，也不重算缓存：避免把刷新时刚删除的目标页缓存在同一次渲染内加回，
    // 到达目标页后再由 addView 重建缓存
    if (name === 'Redirect' && meta?.noTagsView) return
    tagsViewStore.addView(unref(currentRoute))
  }
}

// 关闭选中的tag：非当前页的 tag 直接关闭；当前页的 tag 先离开当前页（见 leaveClosingView），成功后才关闭，
// 跳转被守卫拒绝、被其它导航取代或出错时保留 tag 与缓存。固定 tag 不关闭也不跳转
const closeSelectedTag = async (view: RouteLocationNormalizedLoaded) => {
  if (view?.meta?.affix) return
  if (isActive(view) && !(await leaveClosingView([view], view))) return
  // 无需跳转而仍停留在该页时保留其 tag（原逻辑为删除后由 toLastView 重新添加）
  if (!isActive(view)) {
    closeCurrent(view)
  }
}

// tag 对应的路由仍注册在 router 中：tag 带路由名，路由已被移除时按 tag 跳转会在 push 内同步抛出 MATCHER_NOT_FOUND，
// 因此只把仍注册的 tag 作为关闭后的跳转目标，已移除的 tag 保留在原处
const isRegisteredView = (view: RouteLocationNormalizedLoaded) => {
  return !view.name || hasRoute(view.name)
}

// 跳转结果与 push 一致；push 同步抛出的错误也转为失败（返回 true），由调用方保留 tag 与缓存
const tryPush = async (to: RouteLocationRaw) => {
  try {
    return await push(to)
  } catch {
    return true
  }
}

// 去最后一个
const toLastView = () => {
  const visitedViews = tagsViewStore.getVisitedViews
  const latestView = visitedViews.filter(isRegisteredView).slice(-1)[0]
  if (latestView) {
    tryPush(latestView)
  } else {
    const firstRoute = permissionStore.getAddRouters[0]
    // 动态路由尚未生成、没有首个路由时无处可去，不跳转
    if (!firstRoute) return
    if (
      unref(currentRoute).path === firstRoute.path ||
      unref(currentRoute).path === firstRoute.redirect
    ) {
      addTags()
      return
    }
    // You can set another route
    tryPush(firstRoute.path)
  }
}

// 当前页的 tag 将被关闭时，先跳转到关闭后应显示的页面：
// 关闭单个 tag（传入 adjacentTo）时为其右侧最近的、剩余且路由仍注册的 tag，没有时为左侧最近的；
// 批量关闭时与 toLastView 一致，为剩余且路由仍注册的 tag 的最后一个。
// 都没有时为首个路由；没有剩余且已在首个路由时不跳转，返回 true 并由调用方保留当前页的 tag。
// 跳转成功且已离开当前页返回 true；被守卫拒绝、被其它导航取代或出错返回 false，调用方不关闭任何 tag
const leaveClosingView = async (
  closing: RouteLocationNormalizedLoaded[],
  adjacentTo?: RouteLocationNormalizedLoaded
) => {
  const { path, fullPath } = unref(currentRoute)
  const views = unref(visitedViews)
  const isTarget = (v: RouteLocationNormalizedLoaded) =>
    !closing.some((item) => item.fullPath === v.fullPath) && isRegisteredView(v)
  const index = adjacentTo ? views.findIndex((v) => v.fullPath === adjacentTo.fullPath) : -1
  const latestView =
    index > -1
      ? views.slice(index + 1).find(isTarget) || views.slice(0, index).reverse().find(isTarget)
      : views.filter(isTarget).slice(-1)[0]
  const firstRoute = permissionStore.getAddRouters[0]
  // 没有可跳转的 tag，也没有首个路由（动态路由尚未生成）时无处可去，按跳转失败处理
  if (!latestView && !firstRoute) return false
  if (!latestView && (path === firstRoute.path || path === firstRoute.redirect)) {
    return true
  }
  const failure = await tryPush(latestView || firstRoute.path)
  return !failure && unref(currentRoute).fullPath !== fullPath
}

// 关闭全部：当前页的 tag 不在关闭范围内时沿用原逻辑（先关闭再 toLastView）；
// 否则先离开当前页，成功后只关闭操作开始时可关闭的 tag（不含跳转后所在页），避免删除跳转期间新增的 tag；
// 跳转被拒绝、取代或出错时保留全部 tag 与缓存
const closeAllTags = async () => {
  const closing = getClosableViews(undefined, 'all')
  if (!closing.some((v) => isActive(v))) {
    closeAll(() => {
      toLastView()
    })
    return
  }
  if (!(await leaveClosingView(closing))) return
  closing.filter((v) => !isActive(v)).forEach((v) => closeCurrent(v))
}

type CloseRange = 'left' | 'right' | 'other' | 'all'

// 对应范围内可关闭（非固定）的 tag，范围与 store 的批量删除一致：
// left / right 为 view 左侧 / 右侧，other 为 view 以外，all 为全部
const getClosableViews = (view: RouteLocationNormalizedLoaded | undefined, range: CloseRange) => {
  const views = unref(visitedViews)
  const index = view ? views.findIndex((v) => v.fullPath === view.fullPath) : -1
  return views.filter((v, i) => {
    if (v?.meta?.affix) return false
    if (range === 'all') return true
    if (range === 'other') return v.fullPath !== view?.fullPath
    if (index < 0) return false
    return range === 'left' ? i < index : i > index
  })
}

const hasClosableView = (view: RouteLocationNormalizedLoaded | undefined, range: CloseRange) => {
  return getClosableViews(view, range).length > 0
}

// 批量关闭（其它 / 左侧 / 右侧）以触发操作的 tag 为基准：右键菜单为所属 tag，工具栏为当前页的 tag。
// 当前页的 tag 会被关闭时，先跳转到基准 tag，跳转成功且最终路由不在关闭范围内才关闭；
// 跳转被守卫拒绝、被其它导航取代或出错时不关闭，保留当前页的 tag 与缓存。
// 当前页没有 tag 或其 tag 不在关闭范围内时直接关闭，不导航
const closeTagsAround = async (
  range: Exclude<CloseRange, 'all'>,
  close: (callback?: Fn, view?: RouteLocationNormalizedLoaded) => void,
  anchor: RouteLocationNormalizedLoaded | undefined
) => {
  const isClosing = (fullPath: string) => {
    return getClosableViews(anchor, range).some((v) => v.fullPath === fullPath)
  }
  if (anchor && isClosing(unref(currentRoute).fullPath)) {
    const failure = await tryPush(anchor)
    if (failure || isClosing(unref(currentRoute).fullPath)) return
  }
  close(undefined, anchor)
}

// 关闭其它
const closeOthersTags = (view?: RouteLocationNormalizedLoaded) => {
  closeTagsAround('other', closeOther, view)
}

// 重新加载
const refreshSelectedTag = async (view?: RouteLocationNormalizedLoaded) => {
  refreshPage(view)
}

// 关闭左侧
const closeLeftTags = (view?: RouteLocationNormalizedLoaded) => {
  closeTagsAround('left', closeLeft, view)
}

// 关闭右侧
const closeRightTags = (view?: RouteLocationNormalizedLoaded) => {
  closeTagsAround('right', closeRight, view)
}

// 右键菜单与工具栏“更多”菜单共用：view 为右键所属 tag，或工具栏的当前页 tag（activeTag）。
// 工具栏传入 fromToolbar：当前页没有 tag（view 为 undefined）时刷新仍刷新当前路由，
// 关闭 / 左侧 / 右侧 / 其它禁用，关闭全部按是否还有可关闭的 tag 判断
const createContextMenu = (
  view?: RouteLocationNormalizedLoaded,
  fromToolbar = false
): ContextMenuSchema[] => [
  {
    icon: 'ep:refresh',
    label: 'common.reload',
    disabled: !fromToolbar && !view?.name,
    command: () => {
      refreshSelectedTag(view)
    }
  },
  {
    icon: 'ep:close',
    label: 'common.closeTab',
    disabled: !view || !!view.meta?.affix,
    command: () => {
      if (view) closeSelectedTag(view)
    }
  },
  {
    divided: true,
    icon: 'ep:d-arrow-left',
    label: 'common.closeTheLeftTab',
    disabled: !hasClosableView(view, 'left'),
    command: () => {
      closeLeftTags(view)
    }
  },
  {
    icon: 'ep:d-arrow-right',
    label: 'common.closeTheRightTab',
    disabled: !hasClosableView(view, 'right'),
    command: () => {
      closeRightTags(view)
    }
  },
  {
    divided: true,
    icon: 'ep:discount',
    label: 'common.closeOther',
    disabled: !view || !hasClosableView(view, 'other'),
    command: () => {
      closeOthersTags(view)
    }
  },
  {
    icon: 'ep:minus',
    label: 'common.closeAll',
    disabled: !hasClosableView(view, 'all'),
    command: () => {
      closeAllTags()
    }
  }
]

// 根元素：只在本组件内查找当前 tag（不使用 document 全局 class 查询）
const tagsViewRef = ref<HTMLElement>()

// elscroll 实例
const scrollbarRef = ref<ComponentRef<typeof ElScrollbar>>()

const getScrollWrap = () => unref(scrollbarRef)?.wrapRef as HTMLElement | undefined

// 系统开启“减少动态效果”时立即滚动
const getScrollBehavior = (): ScrollBehavior => {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

// 左右按钮：只滚动标签栏横向滚动容器
const scrollTags = (left: number) => {
  getScrollWrap()?.scrollBy({ left, behavior: getScrollBehavior() })
}

// 滚动到当前 tag：按可见性取“最近”位置，已完整可见时不滚动；
// 只滚动标签栏横向滚动容器，不连带滚动外层页面
const moveToCurrentTag = async () => {
  await nextTick()
  const wrap$ = getScrollWrap()
  const active$ = unref(tagsViewRef)?.querySelector<HTMLElement>(`.${prefixCls}__item.is-active`)
  if (!wrap$ || !active$) return
  const wrapRect = wrap$.getBoundingClientRect()
  const activeRect = active$.getBoundingClientRect()
  const offset =
    activeRect.left < wrapRect.left
      ? activeRect.left - wrapRect.left
      : activeRect.right > wrapRect.right
        ? activeRect.right - wrapRect.right
        : 0
  if (!offset) return
  wrap$.scrollBy({ left: offset, behavior: getScrollBehavior() })
}

// 是否是当前tag
const isActive = (route: RouteLocationNormalizedLoaded): boolean => {
  return route.fullPath === unref(currentRoute).fullPath
}

// tag 展示标题：后端菜单原文不翻译（getRouteTitle），同一路径同名标题的多实例带序号后缀
const getTagTitle = (route: RouteLocationNormalizedLoaded): string => {
  const title = getRouteTitle(route?.meta)
  return route?.meta?.titleSuffix ? `${title} (${route.meta.titleSuffix})` : title
}

// 未扁平的路由树中，各路由名所在分支由自身向上最近的非空图标（没有时为 ''）；同名出现多次、分支不唯一的记为 null。
// 动态路由注册时三级及以上会被扁平，route.matched 缺少中间目录，因此按原树计算；路由树变化时才重新遍历
const branchIconMap = computed(() => {
  const map = new Map<string, string | null>()
  const walk = (routes: AppRouteRecordRaw[], parentIcon: string) => {
    for (const route of routes) {
      const icon = route.meta?.icon || parentIcon
      const name = route.name
      if (typeof name === 'string' && name) {
        map.set(name, map.has(name) ? null : icon)
      }
      if (route.children?.length) walk(route.children, icon)
    }
  }
  walk(unref(routers), '')
  return map
})

// tag 图标：取自身到祖先最近的非空图标。已注册的路由按原树中唯一分支查找；
// 查不到唯一分支时按实际 matched 由近到远查找，最后回退 meta.icon。没有 matched 的固定 tag 沿用自身图标
const getTagIcon = (route: RouteLocationNormalizedLoaded): string | undefined => {
  if (!route?.matched) return route?.meta?.icon
  const name = typeof route.name === 'string' && hasRoute(route.name) ? route.name : undefined
  const branchIcon = name ? unref(branchIconMap).get(name) : undefined
  if (typeof branchIcon === 'string') return branchIcon || undefined
  return (
    [...route.matched].reverse().find((record) => record.meta?.icon)?.meta?.icon || route.meta?.icon
  )
}

// 所有右键菜单组件的元素
const itemRefs = useTemplateRefsList<ComponentRef<typeof ContextMenu & ContextMenuExpose>>()

// 右键菜单打开时关闭其它 tag 的菜单（同一时刻只显示一个右键菜单）。菜单命令与禁用状态直接取所属 tag，
// 不改写选中的 tag：selectedTag 始终为当前路由，供 setTitle 等按当前页定位
const visibleChange = (visible: boolean, tagItem: RouteLocationNormalizedLoaded) => {
  if (!visible) return
  for (const v of unref(itemRefs)) {
    if (tagItem.fullPath !== v.tagItem.fullPath) {
      v.elDropdownMenuRef?.handleClose()
    }
  }
}

// 正文链接点击：路由已被移除时阻止默认行为，不走可能残留的旧 href；否则由 RouterLink 的 navigate 导航
// （带修饰键时交给浏览器）
const onLinkClick = (
  e: MouseEvent,
  item: RouteLocationNormalizedLoaded,
  navigate: (e?: MouseEvent) => unknown
) => {
  if (isRegisteredView(item)) {
    navigate(e)
  } else {
    e.preventDefault()
  }
}

const closeTabOnMouseMidClick = (e: MouseEvent, item: RouteLocationNormalizedLoaded) => {
  // 中键：button === 1
  if (e.button === 1) {
    e.preventDefault()
    e.stopPropagation()
    closeSelectedTag(item)
  }
}

onBeforeMount(() => {
  initTags()
  addTags()
})

watch(
  () => currentRoute.value,
  () => {
    addTags()
    moveToCurrentTag()
  }
)
</script>

<template>
  <!-- 根节点的定位、宽度由布局（useRenderLayout）按菜单布局传入的工具类控制，这里只用同级工具类，
    不在 scoped 样式中声明 position / width，避免压过布局传入的 absolute、fixed 与 w-[calc()] -->
  <div
    ref="tagsViewRef"
    :id="prefixCls"
    :class="prefixCls"
    class="relative w-full flex bg-[#fff] dark:bg-[var(--el-bg-color)]"
  >
    <button
      :aria-label="t('common.scrollTagsLeft')"
      :title="t('common.scrollTagsLeft')"
      :class="[
        `${prefixCls}__tool`,
        tagsViewImmerse ? `${prefixCls}__tool--immerse` : `${prefixCls}__tool--first`
      ]"
      type="button"
      @click="scrollTags(-200)"
    >
      <Icon icon="ep:d-arrow-left" />
    </button>
    <div :class="`${prefixCls}__viewport`">
      <ElScrollbar ref="scrollbarRef" :class="`${prefixCls}__scrollbar`">
        <div :class="[`${prefixCls}__list`, tagsViewImmerse ? `${prefixCls}__list--immerse` : '']">
          <ContextMenu
            v-for="item in visitedViews"
            :key="item.fullPath"
            :ref="itemRefs.set"
            :class="[
              `${prefixCls}__item`,
              tagsViewImmerse ? `${prefixCls}__item--immerse` : '',
              item?.meta?.affix ? `${prefixCls}__item--affix` : '',
              {
                'is-active': isActive(item)
              }
            ]"
            :schema="createContextMenu(item)"
            :tag-item="item"
            @auxclick="closeTabOnMouseMidClick($event, item)"
            @visible-change="visibleChange"
          >
            <div :class="`${prefixCls}__item-body`">
              <!-- 链接目标统一用 fullPath：路由已被移除时按名称解析会抛错，fullPath 解析不抛错；
                只有路由仍注册才带 href。Enter 的 keydown 不冒泡到 ContextMenu 触发器，由链接原生激活触发 click -->
              <router-link v-slot="{ href, navigate }" :to="item.fullPath" custom>
                <a
                  :aria-current="isActive(item) ? 'page' : undefined"
                  :class="`${prefixCls}__link`"
                  :href="isRegisteredView(item) ? href : undefined"
                  @click="onLinkClick($event, item, navigate)"
                  @keydown.enter.stop
                >
                  <Icon
                    v-if="tagsViewIcon && getTagIcon(item)"
                    :icon="getTagIcon(item)"
                    :size="13"
                  />
                  <span>{{ getTagTitle(item) }}</span>
                </a>
              </router-link>
              <!-- 固定标签不渲染关闭按钮。Enter/Space 的 keydown 不冒泡到 ContextMenu 触发器
                （其会 preventDefault 并打开菜单），由按钮原生激活触发一次 click -->
              <button
                v-if="!item?.meta?.affix"
                type="button"
                :class="`${prefixCls}__close`"
                :aria-label="`${t('common.closeTab')}: ${getTagTitle(item)}`"
                @click.prevent.stop="closeSelectedTag(item)"
                @keydown.enter.space.stop
              >
                <Icon :size="13" icon="ep:close" />
              </button>
            </div>
          </ContextMenu>
        </div>
      </ElScrollbar>
    </div>
    <button
      :aria-label="t('common.scrollTagsRight')"
      :title="t('common.scrollTagsRight')"
      :class="[`${prefixCls}__tool`, tagsViewImmerse ? `${prefixCls}__tool--immerse` : '']"
      type="button"
      @click="scrollTags(200)"
    >
      <Icon icon="ep:d-arrow-right" />
    </button>
    <button
      :aria-label="t('common.reload')"
      :title="t('common.reload')"
      :class="[`${prefixCls}__tool`, tagsViewImmerse ? `${prefixCls}__tool--immerse` : '']"
      type="button"
      @click="refreshSelectedTag(activeTag)"
    >
      <Icon icon="ep:refresh-right" />
    </button>
    <!-- 工具栏“更多”作用于当前页的 tag（activeTag）：当前页没有 tag 时，
      刷新仍刷新当前路由，关闭 / 左侧 / 右侧 / 其它禁用，关闭全部可用 -->
    <ContextMenu :schema="createContextMenu(activeTag, true)" trigger="click">
      <!-- 触发器保持非 button 元素：ElDropdown 已为触发器提供 role=button / tabindex 及 Enter、Space 打开，
        这里补可访问名称 -->
      <span
        :aria-label="t('common.moreTabActions')"
        :title="t('common.moreTabActions')"
        :class="[`${prefixCls}__tool`, tagsViewImmerse ? `${prefixCls}__tool--immerse` : '']"
      >
        <Icon icon="ep:menu" />
      </span>
    </ContextMenu>
  </div>
</template>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-tags-view;

.#{$prefix-cls} {
  :deep(.#{$elNamespace}-scrollbar__view) {
    height: 100%;
  }

  &__viewport {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  &__scrollbar {
    height: 100%;
  }

  &__list {
    display: flex;
    height: var(--tags-view-height);
    padding: 3px 4px;
    box-sizing: border-box;
    gap: 4px;
  }

  // 沉浸式标签彼此叠放，贴齐标签栏
  &__list--immerse {
    padding: 0;
    gap: 0;
  }

  // 工具栏按钮：颜色、悬停与键盘聚焦全部由样式控制
  &__tool {
    display: grid;
    flex: none;
    width: var(--tags-view-height);
    height: var(--tags-view-height);
    padding: 0;
    margin: 0;
    font: inherit;
    color: var(--el-text-color-placeholder);
    cursor: pointer;
    background: transparent;
    border: 0;
    border-left: 1px solid var(--layout-border-color);
    box-sizing: border-box;
    transition:
      color 160ms ease,
      background-color 160ms ease;
    place-items: center;

    &:hover,
    &:focus-visible {
      color: var(--el-color-primary);
      background: var(--el-fill-color-light);
      outline: none;
    }

    &--first {
      border-right: 1px solid var(--layout-border-color);
      border-left: 0;
    }

    &--immerse {
      border: 0;
    }
  }

  &__item {
    position: relative;
    flex: none;
    height: 100%;
    font-size: 12px;
    cursor: pointer;
    box-sizing: border-box;
  }

  &__item-body,
  &__link {
    display: flex;
    height: 100%;
    align-items: center;
  }

  &__link {
    padding: 0 12px;
    color: inherit;
    text-decoration: none;
    white-space: nowrap;
    gap: 5px;

    &:focus-visible {
      outline: 2px solid var(--el-color-primary-light-7);
      outline-offset: -2px;
    }
  }

  // 可关闭标签的文字右侧紧邻关闭按钮（沉浸式的关闭按钮悬浮，不适用）
  &__item:not(.#{$prefix-cls}__item--affix):not(.#{$prefix-cls}__item--immerse)
    .#{$prefix-cls}__link {
    padding-right: 4px;
  }

  // 关闭按钮：未悬停时透明且不响应鼠标，但仍可 Tab 聚焦
  &__close {
    display: grid;
    width: 24px;
    height: 100%;
    padding: 0;
    color: inherit;
    pointer-events: none;
    cursor: pointer;
    background: transparent;
    border: 0;
    opacity: 0;
    transition:
      color 160ms ease,
      opacity 160ms ease;
    place-items: center;

    &:hover,
    &:focus-visible {
      color: var(--el-color-danger);
      outline: none;
    }
  }

  &__item:hover .#{$prefix-cls}__close,
  &__close:focus-visible {
    pointer-events: auto;
    opacity: 1;
  }

  // 普通（非沉浸）标签：圆角卡片，选中为主色浅底 + 主色字，选中的可关闭标签常显关闭按钮
  &__item:not(.#{$prefix-cls}__item--immerse) {
    overflow: hidden;
    color: var(--el-text-color-regular);
    border: 1px solid var(--layout-border-color);
    border-radius: 8px;
    transition:
      color 160ms ease,
      background-color 160ms ease,
      border-color 160ms ease;

    &:hover,
    &:focus-within {
      color: var(--el-color-primary);
    }

    &.is-active {
      font-weight: 600;
      color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-7);

      .#{$prefix-cls}__close {
        pointer-events: auto;
        opacity: 1;
      }
    }
  }

  // 沉浸式标签：梯形遮罩、相邻标签叠放，选中与悬停为主色底白字；关闭按钮悬浮在右侧，不占文字宽度
  &__item--immerse {
    top: 2px;
    height: calc(100% - 3px);
    padding-right: 35px;
    margin: 0 -10px;
    border: none;
    -webkit-mask-box-image: url("data:image/svg+xml,%3Csvg width='68' height='34' viewBox='0 0 68 34' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='m27,0c-7.99582,0 -11.95105,0.00205 -12,12l0,6c0,8.284 -0.48549,16.49691 -8.76949,16.49691l54.37857,-0.11145c-8.284,0 -8.60908,-8.10146 -8.60908,-16.38546l0,-6c0.11145,-12.08445 -4.38441,-12 -12,-12l-13,0z' fill='%23409eff'/%3E%3C/svg%3E")
      12 27 15;

    .#{$prefix-cls}__link {
      padding: 0 0 0 35px;
    }

    .#{$prefix-cls}__close {
      position: absolute;
      top: 50%;
      right: 20px;
      width: auto;
      height: auto;
      transform: translate(0, -50%);

      // 主色底上保持白色前景，键盘聚焦以描边提示
      &:hover,
      &:focus-visible {
        color: inherit;
      }

      &:focus-visible {
        outline: 1px solid currentcolor;
        outline-offset: 1px;
      }
    }

    &.is-active,
    &:hover {
      color: var(--el-color-white);
      background-color: var(--el-color-primary);
    }
  }
}

// 暗色下普通选中标签前景改用正文主色：主色浅底（light-9）在暗色为深色色阶，主色字对比不足
.dark .#{$prefix-cls}__item:not(.#{$prefix-cls}__item--immerse).is-active {
  color: var(--el-text-color-primary);
}
</style>
