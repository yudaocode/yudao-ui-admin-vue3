<script lang="ts" setup>
import { computed, nextTick, ref, unref, watch } from 'vue'
import type { RouteLocationNormalizedLoaded, RouterLinkProps } from 'vue-router'
import { useRouter } from 'vue-router'
import { usePermissionStore } from '@/store/modules/permission'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { useAppStore } from '@/store/modules/app'
import { useI18n } from '@/hooks/web/useI18n'
import { filterAffixTags } from './helper'
import { ContextMenu, ContextMenuExpose } from '@/layout/components/ContextMenu'
import { useDesign } from '@/hooks/web/useDesign'
import { useTemplateRefsList } from '@vueuse/core'
import { ElScrollbar } from 'element-plus'
import { useScrollTo } from '@/hooks/event/useScrollTo'
import { useTagsView } from '@/hooks/web/useTagsView'
import { cloneDeep } from 'lodash-es'

defineOptions({ name: 'TagsView' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('tags-view')

const { t } = useI18n()

const { currentRoute, push } = useRouter()

const { closeAll, closeLeft, closeRight, closeOther, closeCurrent, refreshPage } = useTagsView()

const permissionStore = usePermissionStore()

const routers = computed(() => permissionStore.getRouters)

const tagsViewStore = useTagsViewStore()

const visitedViews = computed(() => tagsViewStore.getVisitedViews)

const affixTagArr = ref<RouteLocationNormalizedLoaded[]>([])

const selectedTag = computed(() => tagsViewStore.getSelectedTag)

const setSelectTag = tagsViewStore.setSelectedTag

const appStore = useAppStore()

const tagsViewImmerse = computed(() => appStore.getTagsViewImmerse)

const tagsViewIcon = computed(() => appStore.getTagsViewIcon)

const isDark = computed(() => appStore.getIsDark)

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

// 关闭选中的tag
const closeSelectedTag = (view: RouteLocationNormalizedLoaded) => {
  closeCurrent(view, () => {
    if (isActive(view)) {
      toLastView()
    }
  })
}

// 去最后一个
const toLastView = () => {
  const visitedViews = tagsViewStore.getVisitedViews
  const latestView = visitedViews.slice(-1)[0]
  if (latestView) {
    push(latestView)
  } else {
    if (
      unref(currentRoute).path === permissionStore.getAddRouters[0].path ||
      unref(currentRoute).path === permissionStore.getAddRouters[0].redirect
    ) {
      addTags()
      return
    }
    // You can set another route
    push(permissionStore.getAddRouters[0].path)
  }
}

// 关闭全部
const closeAllTags = () => {
  closeAll(() => {
    toLastView()
  })
}

type CloseRange = 'left' | 'right' | 'other' | 'all'

// 对应范围内可关闭（非固定）的 tag，范围与 store 的批量删除一致（参考上游 e66532cf9）：
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

// 批量关闭（其它 / 左侧 / 右侧）以操作开始时选中的 tag 为基准（参考上游 e66532cf9）：
// 当前页的 tag 会被关闭时，先跳转到该 tag，跳转成功且最终路由不在关闭范围内才关闭；
// 跳转被守卫拒绝、被其它导航取代或出错时不关闭，保留当前页的 tag 与缓存。
// 当前页没有 tag 或其 tag 不在关闭范围内时直接关闭，不导航
const closeTagsAround = async (
  range: Exclude<CloseRange, 'all'>,
  close: (callback?: Fn, view?: RouteLocationNormalizedLoaded) => void
) => {
  const anchor = unref(selectedTag)
  const isClosing = (fullPath: string) => {
    return getClosableViews(anchor, range).some((v) => v.fullPath === fullPath)
  }
  if (anchor && isClosing(unref(currentRoute).fullPath)) {
    const failure = await push(anchor).catch(() => true)
    if (failure || isClosing(unref(currentRoute).fullPath)) return
  }
  close(undefined, anchor)
}

// 关闭其它
const closeOthersTags = () => {
  closeTagsAround('other', closeOther)
}

// 重新加载
const refreshSelectedTag = async (view?: RouteLocationNormalizedLoaded) => {
  refreshPage(view)
}

// 关闭左侧
const closeLeftTags = () => {
  closeTagsAround('left', closeLeft)
}

// 关闭右侧
const closeRightTags = () => {
  closeTagsAround('right', closeRight)
}

// 滚动到选中的tag
const moveToCurrentTag = async () => {
  await nextTick()
  for (const v of unref(visitedViews)) {
    if (v.fullPath === unref(currentRoute).fullPath) {
      moveToTarget(v)
      break
    }
  }
}

const tagLinksRefs = useTemplateRefsList<RouterLinkProps>()

const moveToTarget = (currentTag: RouteLocationNormalizedLoaded) => {
  const wrap$ = unref(scrollbarRef)?.wrapRef
  if (!wrap$) return
  let firstTag: Nullable<RouterLinkProps> = null
  let lastTag: Nullable<RouterLinkProps> = null

  const tagList = unref(tagLinksRefs)
  if (!tagList.length) return
  // find first tag and last tag
  if (tagList.length > 0) {
    firstTag = tagList[0]
    lastTag = tagList[tagList.length - 1]
  }
  if ((firstTag?.to as RouteLocationNormalizedLoaded).fullPath === currentTag.fullPath) {
    // 直接滚动到0的位置
    const { start } = useScrollTo({
      el: wrap$!,
      position: 'scrollLeft',
      to: 0,
      duration: 500
    })
    start()
  } else if ((lastTag?.to as RouteLocationNormalizedLoaded).fullPath === currentTag.fullPath) {
    // 滚动到最后的位置
    const { start } = useScrollTo({
      el: wrap$!,
      position: 'scrollLeft',
      to: wrap$!.scrollWidth - wrap$!.offsetWidth,
      duration: 500
    })
    start()
  } else {
    // find preTag and nextTag
    const currentIndex: number = tagList.findIndex(
      (item) =>
        (item?.to as RouteLocationNormalizedLoaded | undefined)?.fullPath === currentTag.fullPath
    )
    if (currentIndex < 0) return
    const tgsRefs = document.getElementsByClassName(`${prefixCls}__item`)

    const prevTag = tgsRefs[currentIndex - 1] as HTMLElement
    const nextTag = tgsRefs[currentIndex + 1] as HTMLElement
    if (!prevTag || !nextTag) return

    // the tag's offsetLeft after of nextTag
    const afterNextTagOffsetLeft = nextTag.offsetLeft + nextTag.offsetWidth + 4

    // the tag's offsetLeft before of prevTag
    const beforePrevTagOffsetLeft = prevTag.offsetLeft - 4

    if (afterNextTagOffsetLeft > unref(scrollLeftNumber) + wrap$!.offsetWidth) {
      const { start } = useScrollTo({
        el: wrap$!,
        position: 'scrollLeft',
        to: afterNextTagOffsetLeft - wrap$!.offsetWidth,
        duration: 500
      })
      start()
    } else if (beforePrevTagOffsetLeft < unref(scrollLeftNumber)) {
      const { start } = useScrollTo({
        el: wrap$!,
        position: 'scrollLeft',
        to: beforePrevTagOffsetLeft,
        duration: 500
      })
      start()
    }
  }
}

// 是否是当前tag
const isActive = (route: RouteLocationNormalizedLoaded): boolean => {
  return route.fullPath === unref(currentRoute).fullPath
}

// 所有右键菜单组件的元素
const itemRefs = useTemplateRefsList<ComponentRef<typeof ContextMenu & ContextMenuExpose>>()

// 右键菜单状态改变的时候
const visibleChange = (visible: boolean, tagItem: RouteLocationNormalizedLoaded) => {
  if (visible) {
    for (const v of unref(itemRefs)) {
      const elDropdownMenuRef = v.elDropdownMenuRef
      if (tagItem.fullPath !== v.tagItem.fullPath) {
        elDropdownMenuRef?.handleClose()
        setSelectTag(tagItem)
      }
    }
  }
}

// elscroll 实例
const scrollbarRef = ref<ComponentRef<typeof ElScrollbar>>()

// 保存滚动位置
const scrollLeftNumber = ref(0)

const scroll = ({ scrollLeft }) => {
  scrollLeftNumber.value = scrollLeft as number
}

// 移动到某个位置
const move = (to: number) => {
  const wrap$ = unref(scrollbarRef)?.wrapRef
  const { start } = useScrollTo({
    el: wrap$!,
    position: 'scrollLeft',
    to: unref(scrollLeftNumber) + to,
    duration: 500
  })
  start()
}

const closeTabOnMouseMidClick = (e: MouseEvent, item) => {
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
  <div
    :id="prefixCls"
    :class="prefixCls"
    class="relative w-full flex bg-[#fff] dark:bg-[var(--el-bg-color)]"
  >
    <!-- 工具栏为原生按钮，可键盘聚焦并带可访问名称（参考上游 e66532cf9） -->
    <button
      :aria-label="t('common.scrollTagsLeft')"
      :class="[
        tagsViewImmerse ? '' : `${prefixCls}__tool ${prefixCls}__tool--first`,
        `${prefixCls}__tool-button`
      ]"
      class="h-[var(--tags-view-height)] w-[var(--tags-view-height)] flex cursor-pointer items-center justify-center"
      type="button"
      @click="move(-200)"
    >
      <Icon
        :hover-color="isDark ? '#fff' : 'var(--el-color-black)'"
        color="var(--el-text-color-placeholder)"
        icon="ep:d-arrow-left"
      />
    </button>
    <div class="flex-1 overflow-hidden">
      <ElScrollbar ref="scrollbarRef" class="h-full" @scroll="scroll">
        <div class="h-[var(--tags-view-height)] flex">
          <ContextMenu
            v-for="item in visitedViews"
            :key="item.fullPath"
            :ref="itemRefs.set"
            @auxclick="closeTabOnMouseMidClick($event, item)"
            :class="[
              `${prefixCls}__item`,
              tagsViewImmerse ? `${prefixCls}__item--immerse` : '',
              tagsViewIcon ? `${prefixCls}__item--icon` : '',
              tagsViewImmerse && tagsViewIcon ? `${prefixCls}__item--immerse--icon` : '',
              item?.meta?.affix ? `${prefixCls}__item--affix` : '',
              {
                'is-active': isActive(item)
              }
            ]"
            :schema="[
              {
                icon: 'ep:refresh',
                label: t('common.reload'),
                disabled: selectedTag?.fullPath !== item.fullPath,
                command: () => {
                  refreshSelectedTag(item)
                }
              },
              {
                icon: 'ep:close',
                label: t('common.closeTab'),
                disabled: !!visitedViews?.length && selectedTag?.meta.affix,
                command: () => {
                  closeSelectedTag(item)
                }
              },
              {
                divided: true,
                icon: 'ep:d-arrow-left',
                label: t('common.closeTheLeftTab'),
                disabled:
                  (!!visitedViews?.length &&
                    (item.fullPath === visitedViews[0].fullPath ||
                      selectedTag?.fullPath !== item.fullPath)) ||
                  !hasClosableView(item, 'left'),
                command: () => {
                  closeLeftTags()
                }
              },
              {
                icon: 'ep:d-arrow-right',
                label: t('common.closeTheRightTab'),
                disabled:
                  (!!visitedViews?.length &&
                    (item.fullPath === visitedViews[visitedViews.length - 1].fullPath ||
                      selectedTag?.fullPath !== item.fullPath)) ||
                  !hasClosableView(item, 'right'),
                command: () => {
                  closeRightTags()
                }
              },
              {
                divided: true,
                icon: 'ep:discount',
                label: t('common.closeOther'),
                disabled:
                  selectedTag?.fullPath !== item.fullPath || !hasClosableView(item, 'other'),
                command: () => {
                  closeOthersTags()
                }
              },
              {
                icon: 'ep:minus',
                label: t('common.closeAll'),
                disabled: !hasClosableView(item, 'all'),
                command: () => {
                  closeAllTags()
                }
              }
            ]"
            :tag-item="item"
            @visible-change="visibleChange"
          >
            <div>
              <router-link :ref="tagLinksRefs.set" v-slot="{ navigate }" :to="{ ...item }" custom>
                <div
                  :class="`h-full flex items-center justify-center whitespace-nowrap pl-15px ${prefixCls}__item--label`"
                  @click="navigate"
                >
                  <Icon
                    v-if="
                      tagsViewIcon &&
                      (item?.meta?.icon ||
                        (item?.matched &&
                          item.matched[0] &&
                          item.matched[item.matched.length - 1].meta?.icon))
                    "
                    :icon="item?.meta?.icon || item.matched[item.matched.length - 1].meta.icon"
                    :size="12"
                    class="mr-5px"
                  />
                  {{
                    t(item?.meta?.title as string) +
                    (item?.meta?.titleSuffix ? ` (${item?.meta?.titleSuffix})` : '')
                  }}
                  <!-- 原生按钮便于键盘聚焦与读屏（参考上游 8a68d60bb）；固定标签不渲染。
                    Enter/Space 的 keydown 不冒泡到 ContextMenu 触发器（其会 preventDefault 并打开菜单），
                    由按钮原生激活触发一次 click -->
                  <button
                    v-if="!item?.meta?.affix"
                    type="button"
                    :class="`${prefixCls}__item--close`"
                    :aria-label="`${t('common.closeTab')}: ${t(item?.meta?.title as string)}${item?.meta?.titleSuffix ? ` (${item?.meta?.titleSuffix})` : ''}`"
                    @click.prevent.stop="closeSelectedTag(item)"
                    @keydown.enter.space.stop
                  >
                    <Icon :size="12" color="#333" icon="ep:close" />
                  </button>
                </div>
              </router-link>
            </div>
          </ContextMenu>
        </div>
      </ElScrollbar>
    </div>
    <button
      :aria-label="t('common.scrollTagsRight')"
      :class="[tagsViewImmerse ? '' : `${prefixCls}__tool`, `${prefixCls}__tool-button`]"
      class="h-[var(--tags-view-height)] w-[var(--tags-view-height)] flex cursor-pointer items-center justify-center"
      type="button"
      @click="move(200)"
    >
      <Icon
        :hover-color="isDark ? '#fff' : 'var(--el-color-black)'"
        color="var(--el-text-color-placeholder)"
        icon="ep:d-arrow-right"
      />
    </button>
    <button
      :aria-label="t('common.reload')"
      :class="[tagsViewImmerse ? '' : `${prefixCls}__tool`, `${prefixCls}__tool-button`]"
      class="h-[var(--tags-view-height)] w-[var(--tags-view-height)] flex cursor-pointer items-center justify-center"
      type="button"
      @click="refreshSelectedTag(selectedTag)"
    >
      <Icon
        :hover-color="isDark ? '#fff' : 'var(--el-color-black)'"
        color="var(--el-text-color-placeholder)"
        icon="ep:refresh-right"
      />
    </button>
    <ContextMenu
      :schema="[
        {
          icon: 'ep:refresh',
          label: t('common.reload'),
          command: () => {
            refreshSelectedTag(selectedTag)
          }
        },
        {
          icon: 'ep:close',
          label: t('common.closeTab'),
          disabled: !!visitedViews?.length && selectedTag?.meta.affix,
          command: () => {
            closeSelectedTag(selectedTag!)
          }
        },
        {
          divided: true,
          icon: 'ep:d-arrow-left',
          label: t('common.closeTheLeftTab'),
          disabled:
            (!!visitedViews?.length && selectedTag?.fullPath === visitedViews[0].fullPath) ||
            !hasClosableView(selectedTag, 'left'),
          command: () => {
            closeLeftTags()
          }
        },
        {
          icon: 'ep:d-arrow-right',
          label: t('common.closeTheRightTab'),
          disabled:
            (!!visitedViews?.length &&
              selectedTag?.fullPath === visitedViews[visitedViews.length - 1].fullPath) ||
            !hasClosableView(selectedTag, 'right'),
          command: () => {
            closeRightTags()
          }
        },
        {
          divided: true,
          icon: 'ep:discount',
          label: t('common.closeOther'),
          disabled: !hasClosableView(selectedTag, 'other'),
          command: () => {
            closeOthersTags()
          }
        },
        {
          icon: 'ep:minus',
          label: t('common.closeAll'),
          disabled: !hasClosableView(selectedTag, 'all'),
          command: () => {
            closeAllTags()
          }
        }
      ]"
      trigger="click"
    >
      <!-- ElDropdown 已为触发器提供 role=button / tabindex 及 Enter、Space 打开，这里补可访问名称 -->
      <span
        :aria-label="t('common.moreTabActions')"
        :class="tagsViewImmerse ? '' : `${prefixCls}__tool`"
        class="block h-[var(--tags-view-height)] w-[var(--tags-view-height)] flex cursor-pointer items-center justify-center"
      >
        <Icon
          :hover-color="isDark ? '#fff' : 'var(--el-color-black)'"
          color="var(--el-text-color-placeholder)"
          icon="ep:menu"
        />
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

  // 工具栏原生按钮：去掉浏览器默认样式，尺寸、边线与原 span 一致；键盘聚焦时在按钮内侧显示焦点框
  &__tool-button {
    padding: 0;
    margin: 0;
    font: inherit;
    color: inherit;
    background: none;
    border: none;

    &:focus-visible {
      outline: 1px solid var(--el-color-primary);
      outline-offset: -2px;
    }
  }

  &__tool {
    position: relative;

    &::before {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-left: 1px solid var(--el-border-color);
      content: '';
    }

    &--first {
      &::before {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-right: 1px solid var(--el-border-color);
        border-left: none;
        content: '';
      }
    }
  }

  &__item {
    position: relative;
    top: 3px;
    height: calc(100% - 6px);
    padding-right: 15px;
    margin-left: 4px;
    font-size: 12px;
    cursor: pointer;
    border: 1px solid #d9d9d9;
    border-radius: 2px;
    box-sizing: border-box;

    // 未悬停时透明且不响应鼠标，但仍可 Tab 聚焦；不占布局宽度
    &--close {
      position: absolute;
      top: 50%;
      right: 5px;
      display: inline-flex;
      padding: 0;
      color: inherit;
      pointer-events: none;
      cursor: pointer;
      background: none;
      border: none;
      opacity: 0;
      transform: translate(0, -50%);
      align-items: center;
      justify-content: center;

      &:focus-visible {
        pointer-events: auto;
        outline: 1px solid currentcolor;
        outline-offset: 1px;
        opacity: 1;
      }
    }

    &:not(.#{$prefix-cls}__item--affix):hover {
      .#{$prefix-cls}__item--close {
        pointer-events: auto;
        opacity: 1;
      }
    }
  }

  &__item--icon {
    padding-right: 20px;
  }

  &__item:not(.is-active) {
    &:hover {
      color: var(--el-color-primary);
    }
  }

  &__item.is-active {
    color: var(--el-color-white);
    background-color: var(--el-color-primary);
    border: 1px solid var(--el-color-primary);

    .#{$prefix-cls}__item--close {
      :deep(svg) {
        color: var(--el-color-white) !important;
      }
    }
  }

  &__item--immerse {
    top: 2px;
    height: calc(100% - 3px);
    padding-right: 35px;
    margin: 0 -10px;
    border: none !important;
    -webkit-mask-box-image: url("data:image/svg+xml,%3Csvg width='68' height='34' viewBox='0 0 68 34' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='m27,0c-7.99582,0 -11.95105,0.00205 -12,12l0,6c0,8.284 -0.48549,16.49691 -8.76949,16.49691l54.37857,-0.11145c-8.284,0 -8.60908,-8.10146 -8.60908,-16.38546l0,-6c0.11145,-12.08445 -4.38441,-12 -12,-12l-13,0z' fill='%23409eff'/%3E%3C/svg%3E")
      12 27 15;

    .#{$prefix-cls}__item--label {
      padding-left: 35px;
    }

    .#{$prefix-cls}__item--close {
      right: 20px;
    }
  }

  &__item--immerse--icon {
    padding-right: 35px;
  }

  &__item--immerse:not(.is-active) {
    &:hover {
      color: var(--el-color-white);
      background-color: var(--el-color-primary);

      .#{$prefix-cls}__item--close {
        :deep(svg) {
          color: var(--el-color-white) !important;
        }
      }
    }
  }
}

.dark {
  .#{$prefix-cls} {
    &__tool {
      &--first {
        &::after {
          display: none;
        }
      }
    }

    &__item {
      border: 1px solid var(--el-border-color);
    }

    &__item:not(.is-active) {
      &:hover {
        color: var(--el-color-primary);
      }
    }

    &__item.is-active {
      color: var(--el-color-white);
      background-color: var(--el-color-primary);
      border: 1px solid var(--el-color-primary);

      .#{$prefix-cls}__item--close {
        :deep(svg) {
          color: var(--el-color-white) !important;
        }
      }
    }

    &__item--immerse:not(.is-active) {
      &:hover {
        color: var(--el-color-white);
      }
    }
  }
}
</style>
