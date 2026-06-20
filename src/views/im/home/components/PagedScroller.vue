<template>
  <!--
    分页增量滚动容器
    - 滚到底部自动 page++，直到全部渲染完
    - 通过 slot 暴露每一项，让调用方自己决定渲染
  -->
  <el-scrollbar ref="scrollbarRef" class="w-full h-full">
    <slot
      v-for="(item, idx) in displayItems"
      :item="item"
      :index="idx"
      :key="resolveItemKey(item, idx)"
    ></slot>
    <div v-if="showFooter" class="py-3 text-xs text-center text-[var(--el-text-color-secondary)]">
      已到底部
    </div>
  </el-scrollbar>
</template>

<script lang="ts" setup generic="T">
import { computed, onMounted, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { ElScrollbar } from 'element-plus'

defineOptions({ name: 'ImPagedScroller' })

const props = withDefaults(
  defineProps<{
    items: T[] // 全量数据
    pageSize?: number // 每页渲染条数
    threshold?: number // 距底多少 px 触发下一页
    itemKey?: string // 业务 id 字段名（如 'userId' / 'id'）；不传 / 字段值非 string|number 时回退 idx
  }>(),
  {
    pageSize: 30,
    threshold: 30
  }
)

/** 解析每条 item 的 :key：caller 传 itemKey 则按字段取，无效 / 缺失回退索引，避免传错字段时全表 undefined key */
function resolveItemKey(item: T, idx: number): string | number {
  if (!props.itemKey || item == null || typeof item !== 'object') {
    return idx
  }
  const value = (item as Record<string, unknown>)[props.itemKey]
  return typeof value === 'string' || typeof value === 'number' ? value : idx
}

const scrollbarRef = useTemplateRef<InstanceType<typeof ElScrollbar>>('scrollbarRef')
const page = ref(1)

const displayItems = computed(() => {
  const limit = Math.min(page.value * props.pageSize, props.items.length)
  return props.items.slice(0, limit)
})

const allLoaded = computed(() => displayItems.value.length >= props.items.length)

/** 仅当超过一页时才显示「已到底部」，避免短列表也出现这条提示 */
const showFooter = computed(() => allLoaded.value && props.items.length > props.pageSize)

// el-scrollbar 根节点是 overflow:hidden 的，真正的滚动容器是内部 .el-scrollbar__wrap
let wrapEl: HTMLElement | null = null

onMounted(() => {
  wrapEl = scrollbarRef.value?.$el?.querySelector('.el-scrollbar__wrap') ?? null
  wrapEl?.addEventListener('scroll', onScroll)
})

onBeforeUnmount(() => {
  wrapEl?.removeEventListener('scroll', onScroll)
})

/** 切换数据源（如切会话）时重置分页：避免新列表沿用旧 page，首屏出现空段 */
watch(
  () => props.items,
  () => {
    page.value = 1
  }
)

/** 滚到距底 threshold 内时自增 page，扩出下一段切片 */
function onScroll(e: Event) {
  const el = e.target as HTMLElement
  if (el.scrollTop + el.clientHeight < el.scrollHeight - props.threshold) {
    return
  }
  if (allLoaded.value) {
    return
  }
  page.value++
}

defineExpose({
  /** 手动滚到顶部 */
  scrollTop: () => {
    if (wrapEl) {
      wrapEl.scrollTop = 0
    }
  },
  /** 手动滚到底部 */
  scrollBottom: () => {
    if (wrapEl) {
      wrapEl.scrollTop = wrapEl.scrollHeight
    }
  }
})
</script>
