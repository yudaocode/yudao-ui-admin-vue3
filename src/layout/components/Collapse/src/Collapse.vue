<script lang="ts" setup>
import { useAppStore } from '@/store/modules/app'
import { propTypes } from '@/utils/propTypes'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'Collapse' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('collapse')

defineProps({
  color: propTypes.string.def('')
})

const appStore = useAppStore()

const { t } = useI18n()

const collapse = computed(() => appStore.getCollapse)

const toggleCollapse = () => {
  const collapsed = unref(collapse)
  appStore.setCollapse(!collapsed)
}
</script>

<template>
  <!-- 原生 button，可键盘聚焦并带可访问名称及展开状态（参考上游 6b10db306） -->
  <button
    :aria-expanded="!collapse"
    :aria-label="t(collapse ? 'layout.expandNavigation' : 'layout.collapseNavigation')"
    :class="prefixCls"
    type="button"
    @click="toggleCollapse"
  >
    <Icon
      :color="color"
      :icon="collapse ? 'ep:expand' : 'ep:fold'"
      :size="18"
      class="cursor-pointer"
    />
  </button>
</template>
<style lang="scss" scoped>
// :where 不增加优先级，只重置原生 button 默认样式；高度、内边距、hover 仍由外部 custom-hover 决定，保留 focus outline
:where(.v-collapse) {
  padding: 0;
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
}
</style>
