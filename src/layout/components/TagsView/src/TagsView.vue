<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, unref, watch } from 'vue'
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

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('tags-view')

const { t } = useI18n()

const { currentRoute, push, replace } = useRouter()

const permissionStore = usePermissionStore()

const routers = computed(() => permissionStore.getRouters)

const tagsViewStore = useTagsViewStore()

const visitedViews = computed(() => tagsViewStore.getVisitedViews)

const affixTagArr = ref<RouteLocationNormalizedLoaded[]>([])

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
      tagsViewStore.addVisitedView(tag)
    }
  }
}

const selectedTag = ref<RouteLocationNormalizedLoaded>()

// 新增tag
const addTags = () => {
  const { name } = unref(currentRoute)
  if (name) {
    selectedTag.value = unref(currentRoute)
    tagsViewStore.addView(unref(currentRoute))
  }
  return false
}

// 关闭选中的tag
const closeSelectedTag = (view: RouteLocationNormalizedLoaded) => {
  if (view?.meta?.affix) return
  tagsViewStore.delView(view)
  if (isActive(view)) {
    toLastView()
  }
}

// 关闭全部
const closeAllTags = () => {
  tagsViewStore.delAllViews()
  toLastView()
}

// 关闭其它
const closeOthersTags = () => {
  tagsViewStore.delOthersViews(unref(selectedTag) as RouteLocationNormalizedLoaded)
}

// 重新加载
const refreshSelectedTag = async (view?: RouteLocationNormalizedLoaded) => {
  if (!view) return
  tagsViewStore.delCachedView()
  const { path, query } = view
  await nextTick()
  replace({
    path: '/redirect' + path,
    query: query
  })
}

// 关闭左侧
const closeLeftTags = () => {
  tagsViewStore.delLeftViews(unref(selectedTag) as RouteLocationNormalizedLoaded)
}

// 关闭右侧
const closeRightTags = () => {
  tagsViewStore.delRightViews(unref(selectedTag) as RouteLocationNormalizedLoaded)
}

// 跳转到最后一个
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
    // TODO: You can set another route
    push('/')
  }
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
  let firstTag: Nullable<RouterLinkProps> = null
  let lastTag: Nullable<RouterLinkProps> = null

  const tagList = unref(tagLinksRefs)
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
      (item) => (item?.to as RouteLocationNormalizedLoaded).fullPath === currentTag.fullPath
    )
    const tgsRefs = document.getElementsByClassName(`${prefixCls}__item`)

    const prevTag = tgsRefs[currentIndex - 1] as HTMLElement
    const nextTag = tgsRefs[currentIndex + 1] as HTMLElement

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

// 右键菜单装填改变的时候
const visibleChange = (visible: boolean, tagItem: RouteLocationNormalizedLoaded) => {
  if (visible) {
    for (const v of unref(itemRefs)) {
      const elDropdownMenuRef = v.elDropdownMenuRef
      if (tagItem.fullPath !== v.tagItem.fullPath) {
        elDropdownMenuRef?.handleClose()
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

onMounted(() => {
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
    <span
      :class="tagsViewImmerse ? '' : `${prefixCls}__tool ${prefixCls}__tool--first`"
      class="h-[var(--tags-view-height)] w-[var(--tags-view-height)] flex cursor-pointer items-center justify-center"
      @click="move(-200)"
    >
      <Icon
        :hover-color="isDark ? '#fff' : 'var(--el-color-black)'"
        color="var(--el-text-color-placeholder)"
        icon="ep:d-arrow-left"
      />
    </span>
    <div class="flex-1 overflow-hidden">
      <ElScrollbar ref="scrollbarRef" class="h-full" @scroll="scroll">
        <div class="h-[var(--tags-view-height)] flex">
          <ContextMenu
            v-for="item in visitedViews"
            :key="item.fullPath"
            :ref="itemRefs.set"
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
                  !!visitedViews?.length &&
                  (item.fullPath === visitedViews[0].fullPath ||
                    selectedTag?.fullPath !== item.fullPath),
                command: () => {
                  closeLeftTags()
                }
              },
              {
                icon: 'ep:d-arrow-right',
                label: t('common.closeTheRightTab'),
                disabled:
                  !!visitedViews?.length &&
                  (item.fullPath === visitedViews[visitedViews.length - 1].fullPath ||
                    selectedTag?.fullPath !== item.fullPath),
                command: () => {
                  closeRightTags()
                }
              },
              {
                divided: true,
                icon: 'ep:discount',
                label: t('common.closeOther'),
                disabled: selectedTag?.fullPath !== item.fullPath,
                command: () => {
                  closeOthersTags()
                }
              },
              {
                icon: 'ep:minus',
                label: t('common.closeAll'),
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
                  <Icon
                    :class="`${prefixCls}__item--close`"
                    :size="12"
                    color="#333"
                    icon="ep:close"
                    @click.prevent.stop="closeSelectedTag(item)"
                  />
                </div>
              </router-link>
            </div>
          </ContextMenu>
        </div>
      </ElScrollbar>
    </div>
    <span
      :class="tagsViewImmerse ? '' : `${prefixCls}__tool`"
      class="h-[var(--tags-view-height)] w-[var(--tags-view-height)] flex cursor-pointer items-center justify-center"
      @click="move(200)"
    >
      <Icon
        :hover-color="isDark ? '#fff' : 'var(--el-color-black)'"
        color="var(--el-text-color-placeholder)"
        icon="ep:d-arrow-right"
      />
    </span>
    <span
      :class="tagsViewImmerse ? '' : `${prefixCls}__tool`"
      class="h-[var(--tags-view-height)] w-[var(--tags-view-height)] flex cursor-pointer items-center justify-center"
      @click="refreshSelectedTag(selectedTag)"
    >
      <Icon
        :hover-color="isDark ? '#fff' : 'var(--el-color-black)'"
        color="var(--el-text-color-placeholder)"
        icon="ep:refresh-right"
      />
    </span>
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
          disabled: !!visitedViews?.length && selectedTag?.fullPath === visitedViews[0].fullPath,
          command: () => {
            closeLeftTags()
          }
        },
        {
          icon: 'ep:d-arrow-right',
          label: t('common.closeTheRightTab'),
          disabled:
            !!visitedViews?.length &&
            selectedTag?.fullPath === visitedViews[visitedViews.length - 1].fullPath,
          command: () => {
            closeRightTags()
          }
        },
        {
          divided: true,
          icon: 'ep:discount',
          label: t('common.closeOther'),
          command: () => {
            closeOthersTags()
          }
        },
        {
          icon: 'ep:minus',
          label: t('common.closeAll'),
          command: () => {
            closeAllTags()
          }
        }
      ]"
      trigger="click"
    >
      <span
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

    &--close {
      position: absolute;
      top: 50%;
      right: 5px;
      display: none;
      transform: translate(0, -50%);
    }

    &:not(.#{$prefix-cls}__item--affix):hover {
      .#{$prefix-cls}__item--close {
        display: block;
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
      :deep(span) {
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
        :deep(span) {
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
        :deep(span) {
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
