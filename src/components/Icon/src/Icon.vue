<script lang="ts" setup>
import { Icon as IconifyIcon } from '@iconify/vue'
import { useDesign } from '@/hooks/web/useDesign'
import { isIconAvailable, isOfflineIcon, warnUnavailableIcon } from '@/plugins/svgIcon'
import { isNumber, isString } from '@/utils/is'

defineOptions({ name: 'Icon' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('icon')

// 原生运行时 props 声明；运行时与原 vue-types 声明一致：
// icon、color、hoverColor 无默认值（未传为 undefined），size 默认 16，svgClass 默认 ''
const props = defineProps({
  // icon name
  icon: { type: String },
  // icon color
  color: { type: String },
  // icon size：数字按 px，也可传 '1.5em'、'2rem'、'var(--x)' 等 CSS 尺寸
  size: { type: [Number, String], default: 16 },
  // icon svg class
  svgClass: { type: String, default: '' },
  // icon hover color：仅传值时生效，不影响未传值的图标
  hoverColor: { type: String }
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
  // isLocal 为 true 时 icon 必为字符串，可选链只用于类型收窄，不改变结果
  return unref(isLocal) ? `#icon-${props.icon?.split('svg-icon:')[1]}` : unref(iconName)
})

// 离线图标模式下未注册的图标：渲染同尺寸占位，不请求 Iconify API
// 未传或空 icon 不渲染（见模板），也不视为未注册图标告警
const isUnavailable = computed(
  () => !!props.icon && isOfflineIcon && !unref(isLocal) && !isIconAvailable(unref(symbolId))
)

watchEffect(() => {
  if (unref(isUnavailable)) warnUnavailableIcon(unref(symbolId))
})

// 子图标字号：数字（含数字字符串）沿用 px；其它单位已由外层 ElIcon 设置，子图标用 1em 继承，避免 em 叠乘
const getInnerSize = computed(() => {
  const { size } = props
  const numeric = isNumber(size) || (isString(size) && size.trim() !== '' && !isNaN(Number(size)))
  return numeric ? `${size}px` : '1em'
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
  <!-- 未传或空 icon 时不渲染，不再留下同尺寸空白 -->
  <ElIcon
    v-if="icon"
    :class="[prefixCls, getHoverClass]"
    :color="color"
    :size="size"
    :style="getHoverStyle"
  >
    <svg v-if="isLocal" :class="getSvgClass">
      <use :xlink:href="symbolId" />
    </svg>

    <span
      v-else-if="isUnavailable"
      :class="getSvgClass"
      :style="{ display: 'inline-block', width: '1em', height: '1em', fontSize: getInnerSize }"
      aria-hidden="true"
    ></span>

    <!-- 未传 icon 时与原先一样原样传入 undefined；类型断言只为满足 IconifyIcon 的必填声明，不改变运行时值 -->
    <IconifyIcon
      v-else
      :icon="symbolId as string"
      :class="getSvgClass"
      :style="{ fontSize: getInnerSize, color }"
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
