<template>
  <!--
    可拖拽宽度的左侧 Aside
    - 使用 localStorage 记住用户上次调整的宽度（storageKey 必填）
    - 拖拽区在右边缘，鼠标变 col-resize
  -->
  <aside
    class="relative flex flex-col shrink-0 bg-[var(--el-fill-color-light)] border-r border-r-solid border-[var(--el-border-color-lighter)] shadow-[2px_0_8px_rgba(0,0,0,0.05)]"
    :style="{ width: asideWidth + 'px' }"
  >
    <slot></slot>
    <div
      class="im-resizable-aside__handle absolute top-0 right--0.75 z-10 flex items-center justify-center w-1.5 h-full cursor-col-resize transition-colors"
      :class="{ 'is-resizing': isResizing }"
      title="拖拽调整宽度"
      @mousedown="startResize"
    >
      <div
        class="im-resizable-aside__line w-0.5 h-full rounded-0.5 bg-transparent transition-all"
      ></div>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'

defineOptions({ name: 'ImResizableAside' })

const props = withDefaults(
  defineProps<{
    defaultWidth?: number // 默认宽度
    minWidth?: number // 最小宽度
    maxWidth?: number // 最大宽度
    storageKey: string // localStorage 存储 key，必填；调用方传 StorageKeys.localStorage.asideWidth
  }>(),
  {
    defaultWidth: 260,
    minWidth: 200,
    maxWidth: 500
  }
)

const asideWidth = ref<number>(props.defaultWidth)
const isResizing = ref(false)
let startX = 0
let startWidth = 0

onMounted(() => {
  const saved = localStorage.getItem(props.storageKey)
  if (saved) {
    const w = parseInt(saved, 10)
    if (!Number.isNaN(w)) {
      asideWidth.value = clamp(w)
    }
  }
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
})

onBeforeUnmount(() => {
  // 拖拽中卸载：复用 stopResize 复位 body cursor/userSelect 并写回当前宽度，避免全局状态泄漏
  if (isResizing.value) {
    stopResize()
  }
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})

/** 把宽度夹到 [minWidth, maxWidth] 区间，恢复 / 拖拽路径都走它兜底 */
function clamp(w: number) {
  return Math.max(props.minWidth, Math.min(props.maxWidth, w))
}

/** 按下拖拽手柄：记录起始位置 + 锁定 body cursor/userSelect，避免拖拽中误选文本 */
function startResize(e: MouseEvent) {
  isResizing.value = true
  startX = e.clientX
  startWidth = asideWidth.value
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  e.preventDefault()
}

/** 拖拽中：按鼠标位移计算新宽度并 clamp 到允许区间 */
function handleResize(e: MouseEvent) {
  if (!isResizing.value) {
    return
  }
  const deltaX = e.clientX - startX
  asideWidth.value = clamp(startWidth + deltaX)
}

/** 松开鼠标：解锁 body 全局态并把当前宽度写入 localStorage 持久化 */
function stopResize() {
  if (!isResizing.value) {
    return
  }
  isResizing.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  localStorage.setItem(props.storageKey, String(asideWidth.value))
}
</script>

<style scoped>
/* hover / 拖拽中 把内部 line 加粗变深，提示手柄可拖；状态在父 handle 上 → 通过后代选择器联动子 line */
.im-resizable-aside__handle:hover .im-resizable-aside__line,
.im-resizable-aside__handle.is-resizing .im-resizable-aside__line {
  width: 3px;
  background-color: #d0d4db;
}
</style>
