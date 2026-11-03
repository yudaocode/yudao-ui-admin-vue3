<script lang="ts" setup>
import { useId } from 'vue'
import { propTypes } from '@/utils/propTypes'
import { isNumber } from '@/utils/is'
import { useDesign } from '@/hooks/web/useDesign'
import Dialog from './Dialog.vue'
import { useResize } from './useResize'

/**
 * 可拖拽边缘调整宽高的对话框（参考上游 e6affad67 的 ResizeDialog）
 *
 * 基于本地 Dialog，标题、全屏、底部按钮、loading 等属性与插槽原样透传；内容区固定开启滚动，
 * 拖拽调整的是 Dialog 的 width 与 maxHeight。不替换、不修改原 Dialog
 */
defineOptions({ name: 'ResizeDialog', inheritAttrs: false })

const props = defineProps({
  modelValue: propTypes.bool.def(false),
  // 初始宽度、内容区初始高度，与 Dialog 默认值一致
  width: propTypes.oneOfType([String, Number]).def('40%'),
  maxHeight: propTypes.oneOfType([String, Number]).def('400px'),
  // 与上游属性名一致：设置时优先于 width / maxHeight（单位 px）
  initWidth: propTypes.number,
  initHeight: propTypes.number,
  // 拖拽时的最小宽度、最小内容高度（px）
  minResizeWidth: propTypes.number.def(300),
  minResizeHeight: propTypes.number.def(100)
})

const emit = defineEmits(['update:modelValue'])

const { getPrefixCls, variables } = useDesign()
const prefixCls = getPrefixCls('resize-dialog')

// 每个实例独立的标记类名：Dialog 内容通过 Teleport 渲染到 body，按该类名定位自己的 .el-dialog
const ownerClass = `${prefixCls}--${useId()}`

const toSize = (value: string | number) => (isNumber(value) ? `${value}px` : value)

const currentWidth = ref<string | number>(props.initWidth ?? props.width)
const currentHeight = ref<string>(toSize(props.initHeight ?? props.maxHeight))

watch(
  () => [props.initWidth, props.width],
  () => {
    currentWidth.value = props.initWidth ?? props.width
  }
)
watch(
  () => [props.initHeight, props.maxHeight],
  () => {
    currentHeight.value = toSize(props.initHeight ?? props.maxHeight)
  }
)

const { attach, detach } = useResize({
  minWidth: () => props.minResizeWidth,
  minHeight: () => props.minResizeHeight,
  onWidthChange: (width) => {
    currentWidth.value = `${width}px`
  },
  onHeightChange: (height) => {
    currentHeight.value = `${height}px`
  }
})

// 定位本实例的 .el-dialog：标记类名通常落在 .el-dialog 上，兼容落在其外层或内层的结构
const getDialogEl = () => {
  const owner = document.querySelector<HTMLElement>(`.${ownerClass}`)
  if (!owner) return null
  const dialogCls = `${variables.elNamespace}-dialog`
  if (owner.classList.contains(dialogCls)) return owner
  return (
    owner.querySelector<HTMLElement>(`.${dialogCls}`) ?? owner.closest<HTMLElement>(`.${dialogCls}`)
  )
}

let isUnmounted = false

// 绑定拖拽监听；重复打开时 attach 内部会先清理上一次的监听
const handleOpened = () => {
  if (isUnmounted || !props.modelValue) return
  const dialogEl = getDialogEl()
  if (dialogEl) attach(dialogEl)
}

const handleUpdate = (value: boolean) => {
  emit('update:modelValue', value)
}

// 打开时尽早绑定（打开动画结束的 opened 事件会再次确认）；关闭、卸载时立即清理监听
watch(
  () => props.modelValue,
  async (visible) => {
    if (!visible) {
      detach()
      return
    }
    await nextTick()
    handleOpened()
  },
  { immediate: true }
)
onBeforeUnmount(() => {
  isUnmounted = true
  detach()
})
</script>

<template>
  <Dialog
    v-bind="$attrs"
    :class="ownerClass"
    :model-value="modelValue"
    :width="currentWidth"
    :max-height="currentHeight"
    scroll
    @update:model-value="handleUpdate"
    @opened="handleOpened"
    @closed="detach"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps || {}"></slot>
    </template>
  </Dialog>
</template>
