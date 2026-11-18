<script lang="ts" setup>
import { computed, unref } from 'vue'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import { getLayoutRenderMode, isHeaderNavLayout } from '@/utils/layout'

defineOptions({ name: 'Logo' })

const props = withDefaults(
  defineProps<{
    // 紧凑模式：只显示图片、隐藏标题；默认 false，标题按布局与折叠规则显示
    compact?: boolean
  }>(),
  { compact: false }
)

const { getPrefixCls } = useDesign()

// 顶栏（非 classic 渲染模式）中的 Logo 加 `${prefixCls}--header` 修饰类，判断按芋道布局
const prefixCls = getPrefixCls('logo')

const appStore = useAppStore()

const title = computed(() => appStore.getTitle)

const layout = computed(() => appStore.getLayout)

const collapse = computed(() => appStore.getCollapse)

// 标题显隐只由当前布局与折叠状态决定：顶部 Logo（非 classic）始终显示，
// 侧栏 Logo（classic）随折叠隐藏；不依赖挂载时机与切换历史；compact 时始终隐藏
const show = computed(
  () => !props.compact && (getLayoutRenderMode(unref(layout)) !== 'classic' || !unref(collapse))
)
</script>

<template>
  <div>
    <!-- 标题隐藏（compact 或侧栏折叠）时链接仅剩图片，以 aria-label 保留可访问名称 -->
    <router-link
      :aria-label="title"
      :class="[
        prefixCls,
        getLayoutRenderMode(layout) !== 'classic' ? `${prefixCls}--header` : '',
        'flex !h-[var(--logo-height)] min-w-0 items-center cursor-pointer px-10px relative decoration-none overflow-hidden'
      ]"
      to="/"
    >
      <!-- 图片 38px、左右内距 10px；标题空间不足时省略，顶栏让位给菜单“更多”入口 -->
      <img class="h-38px w-38px flex-none" src="@/assets/imgs/logo.png" />
      <div
        v-if="show"
        :class="[
          'ml-10px min-w-0 truncate text-15px font-600 tracking-[-0.01em]',
          {
            'text-[var(--logo-title-text-color)]': getLayoutRenderMode(layout) === 'classic',
            'text-[var(--top-header-text-color)]':
              getLayoutRenderMode(layout) === 'topLeft' ||
              isHeaderNavLayout(layout) ||
              getLayoutRenderMode(layout) === 'cutMenu'
          }
        ]"
      >
        {{ title }}
      </div>
    </router-link>
  </div>
</template>
