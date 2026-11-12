<script lang="ts" setup>
import { Icon } from '@/components/Icon'
import { useFullscreen } from '@vueuse/core'
import { propTypes } from '@/utils/propTypes'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'ScreenFull' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('screenfull')

defineProps({
  color: propTypes.string.def('')
})

const { t } = useI18n()

const { toggle, isFullscreen } = useFullscreen()

const toggleFullscreen = () => {
  toggle()
}
</script>

<template>
  <!-- 原生 button，可键盘聚焦并带可访问名称及全屏状态；外部 class（如 custom-hover）仍落在根元素上 -->
  <button
    :aria-label="t(isFullscreen ? 'layout.exitFullscreen' : 'layout.enterFullscreen')"
    :aria-pressed="isFullscreen"
    :class="prefixCls"
    type="button"
    @click="toggleFullscreen"
  >
    <Icon
      :color="color"
      :icon="isFullscreen ? 'zmdi:fullscreen-exit' : 'zmdi:fullscreen'"
      :size="18"
    />
  </button>
</template>

<style lang="scss" scoped>
// :where 不增加优先级，只重置原生 button 默认样式；高度、内边距、hover 仍由外部 custom-hover 决定，保留 focus outline
:where(.v-screenfull) {
  padding: 0;
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
}
</style>
