<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { Icon as IconifyIcon } from '@iconify/vue'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'Icon' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('icon')

const props = defineProps({
  // icon name
  icon: propTypes.string,
  // icon color
  color: propTypes.string,
  // icon size
  size: propTypes.number.def(16),
  // icon svg class
  svgClass: propTypes.string.def(''),
  // icon hover color：仅传值时生效，不影响未传值的图标
  hoverColor: propTypes.string
})

// 上游图标名前缀（如 vi-ep:close），解析时去掉一次，等同 ep:close
const ICON_PREFIX = 'vi-'

const isLocal = computed(() => props.icon?.startsWith('svg-icon:'))

// 仅 vi- 开头且去掉后仍为 集合:图标 格式时才去前缀，其它名称原样使用
const iconName = computed(() => {
  const { icon } = props
  if (typeof icon !== 'string' || !icon.startsWith(ICON_PREFIX)) return icon
  const name = icon.slice(ICON_PREFIX.length)
  return name.includes(':') ? name : icon
})

const symbolId = computed(() => {
  return unref(isLocal) ? `#icon-${props.icon.split('svg-icon:')[1]}` : unref(iconName)
})

const getSvgClass = computed(() => {
  const { svgClass } = props
  return `iconify ${svgClass}`
})

const getHoverClass = computed(() => {
  return props.hoverColor ? `${prefixCls}--hover` : ''
})

const getHoverStyle = computed(() => {
  return props.hoverColor ? { '--icon-hover-color': props.hoverColor } : undefined
})
</script>

<template>
  <ElIcon :class="[prefixCls, getHoverClass]" :color="color" :size="size" :style="getHoverStyle">
    <svg v-if="isLocal" :class="getSvgClass">
      <use :xlink:href="symbolId" />
    </svg>

    <IconifyIcon
      v-else
      :icon="symbolId"
      :class="getSvgClass"
      :style="{ fontSize: `${size}px`, color }"
    />
  </ElIcon>
</template>

<style lang="scss">
$prefix-cls: #{$namespace}-icon;

// IconifyIcon 的 color 为内联样式，需要 !important 覆盖
.#{$prefix-cls}--hover:hover {
  color: var(--icon-hover-color) !important;

  svg {
    color: var(--icon-hover-color) !important;
  }
}
</style>
