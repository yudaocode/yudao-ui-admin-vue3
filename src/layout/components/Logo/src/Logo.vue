<script lang="ts" setup>
import { computed, unref } from 'vue'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import { propTypes } from '@/utils/propTypes'
import { getLayoutRenderMode, isHeaderNavLayout } from '@/utils/layout'

defineOptions({ name: 'Logo' })

const props = defineProps({
  // 紧凑模式：只显示图片、隐藏标题（参考上游 6b10db306）；默认 false，标题按布局与折叠规则显示
  compact: propTypes.bool.def(false)
})

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('logo')

const appStore = useAppStore()

const title = computed(() => appStore.getTitle)

const layout = computed(() => appStore.getLayout)

const collapse = computed(() => appStore.getCollapse)

// 标题显隐只由当前布局与折叠状态决定（参考上游 6b10db306）：顶部 Logo（非 classic）始终显示，
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
        getLayoutRenderMode(layout) !== 'classic' ? `${prefixCls}__Top` : '',
        'flex !h-[var(--logo-height)] items-center cursor-pointer pl-8px relative decoration-none overflow-hidden'
      ]"
      to="/"
    >
      <img
        class="h-[calc(var(--logo-height)-10px)] w-[calc(var(--logo-height)-10px)] flex-none"
        src="@/assets/imgs/logo.png"
      />
      <div
        v-if="show"
        :class="[
          'ml-10px text-16px font-700',
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
