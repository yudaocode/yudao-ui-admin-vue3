<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref, unref, watch } from 'vue'
import { useEventListener, useIntersectionObserver } from '@vueuse/core'
import { debounce } from 'lodash-es'
import { propTypes } from '@/utils/propTypes'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'Waterfall' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('waterfall')

const emit = defineEmits(['loadMore'])

const prop = defineProps({
  data: propTypes.arrayOf(propTypes.any),
  reset: propTypes.bool.def(true),
  width: propTypes.number.def(200),
  gap: propTypes.number.def(20),
  props: propTypes.objectOf(propTypes.string).def({
    src: 'src',
    height: 'height'
  }),
  cols: propTypes.number.def(undefined),
  loadingText: propTypes.string.def('加载中...'),
  loading: propTypes.bool.def(false),
  end: propTypes.bool.def(false),
  endText: propTypes.string.def('没有更多了'),
  autoCenter: propTypes.bool.def(true),
  layout: propTypes.oneOf(['javascript', 'flex']).def('flex')
})

const wrapEl = ref<HTMLDivElement>()

const wrapHeight = ref(0)

const wrapWidth = ref(0)

const loadMore = ref<HTMLDivElement>()

// javascript 布局：带 top/left 的数据
const positionData = ref<any[]>([])

// flex 布局：按列分组的数据
const columnData = ref<any[][]>([])

const srcKey = computed(() => (prop.props?.src as string) || 'src')

const heightKey = computed(() => (prop.props?.height as string) || 'height')

// 固定列数：只有正整数才生效，0、负数或非数字视为未设置
const fixedCols = computed(() => {
  const cols = Math.floor(Number(prop.cols))
  return Number.isFinite(cols) && cols >= 1 ? cols : undefined
})

// 数据项高度：缺失或非法时按 0 处理，避免 NaN
const getItemHeight = (item: any) => {
  const height = Number(item?.[unref(heightKey)])
  return Number.isFinite(height) && height > 0 ? height : 0
}

// flex 布局不依赖列高定位，未提供有效高度时保留图片的自然比例。
// javascript 布局仍要求数据提供高度，缺省按 0 参与定位，避免 NaN。
const getFlexItemHeight = (item: any) => {
  if (unref(fixedCols)) return 'auto'
  const value = item?.[unref(heightKey)]
  if (typeof value !== 'number' && typeof value !== 'string') return 'auto'
  if (typeof value === 'string' && value.trim() === '') return 'auto'
  const height = Number(value)
  return Number.isFinite(height) && height >= 0 ? `${height}px` : 'auto'
}

// 列数 = 固定列数，或 容器宽度 / (图片宽度 + 间距)；至少 1 列
const getCols = (container: HTMLElement) => {
  const { width, gap } = prop
  const cols = unref(fixedCols) ?? Math.floor(container.clientWidth / (width + gap))
  return Number.isFinite(cols) && cols >= 1 ? cols : 1
}

// 每次布局的序号：异步布局期间若又触发了新的布局，旧的结果丢弃
let layoutId = 0

const filterWaterfall = async () => {
  const id = ++layoutId
  await nextTick()
  const container = unref(wrapEl)
  if (!container || id !== layoutId) return

  const { width, gap } = prop
  const data = (prop.data || []) as any[]
  const cols = getCols(container)
  // 每次重新计算列高，数据减少时不残留旧值
  const heights: number[] = []
  const result: any[] = []

  for (let i = 0; i < data.length; i++) {
    const height = getItemHeight(data[i])
    if (i < cols) {
      heights[i] = height
      result.push({
        ...data[i],
        top: 0,
        left: i * (width + gap)
      })
    } else {
      // 其他行，先找出最矮的那一列和索引
      let index = 0
      for (let j = 1; j < cols; j++) {
        if (heights[j] < heights[index]) {
          index = j
        }
      }
      const minHeight = heights[index]
      // 更新最矮列的高度
      heights[index] += height + gap
      result.push({
        ...data[i],
        top: minHeight + gap,
        left: index * (width + gap)
      })
    }
  }

  positionData.value = result
  wrapHeight.value = heights.length ? Math.max(...heights) : 0
  wrapWidth.value = cols * (width + gap) - gap
}

const flexWaterfall = async () => {
  const id = ++layoutId
  await nextTick()
  const container = unref(wrapEl)
  if (!container || id !== layoutId) return

  const data = (prop.data || []) as any[]
  const cols = getCols(container)
  // 根据列数创建数组，依次插入
  const arr: any[][] = Array.from({ length: cols }, () => [])
  for (let i = 0; i < data.length; i++) {
    arr[i % cols].push(data[i])
  }
  columnData.value = arr
}

const initLayout = () => {
  const { layout } = prop
  if (layout === 'javascript') {
    filterWaterfall()
  } else if (layout === 'flex') {
    flexWaterfall()
  }
}

// 数据（含 push 追加）、列数、尺寸、字段映射或布局方式变化时重新布局
watch(
  () => [
    prop.data,
    prop.data?.length,
    prop.cols,
    prop.width,
    prop.gap,
    unref(heightKey),
    prop.layout
  ],
  () => {
    initLayout()
  },
  {
    immediate: true
  }
)

const resizeLayout = debounce(initLayout, 300)

useEventListener(window, 'resize', () => {
  if (prop.reset) {
    resizeLayout()
  }
})

onBeforeUnmount(() => {
  resizeLayout.cancel()
})

// 传入 ref 本身：切换布局后底部元素更换，仍能继续观察
useIntersectionObserver(
  loadMore,
  ([entry]) => {
    if (entry?.isIntersecting && !prop.loading && !prop.end) {
      emit('loadMore')
    }
  },
  {
    threshold: 0.1
  }
)
</script>

<template>
  <div
    ref="wrapEl"
    :class="[
      prefixCls,
      'flex',
      'items-center',
      {
        'justify-center': autoCenter
      }
    ]"
    :style="{
      height: layout === 'javascript' ? `${wrapHeight + 40}px` : 'auto'
    }"
  >
    <template v-if="layout === 'javascript'">
      <div :style="{ width: `${wrapWidth}px`, height: `${wrapHeight + 40}px` }" class="relative">
        <div
          v-for="(item, $index) in positionData"
          :key="`water-${$index}`"
          :class="[`${prefixCls}-item__${$index}`, 'absolute']"
          :style="{
            width: `${width}px`,
            height: `${getItemHeight(item)}px`,
            top: `${item.top}px`,
            left: `${item.left}px`
          }"
        >
          <img :src="item[srcKey]" alt="" class="block h-full w-full" srcset="" />
        </div>
        <div
          ref="loadMore"
          :style="{
            top: `${wrapHeight + gap}px`
          }"
          class="absolute h-40px w-full flex justify-center"
        >
          {{ end ? endText : loadingText }}
        </div>
      </div>
    </template>
    <template v-else-if="layout === 'flex'">
      <div
        :style="{
          width: fixedCols ? '100%' : 'auto'
        }"
        class="relative flex pb-40px"
      >
        <div
          v-for="(item, $index) in columnData"
          :key="`waterWrap-${$index}`"
          :style="{
            marginRight: $index === columnData.length - 1 ? '0' : `${gap}px`
          }"
          class="flex-1"
        >
          <div
            v-for="(child, i) in item"
            :key="`waterWrap-${$index}-${i}`"
            :style="{
              marginBottom: `${gap}px`,
              width: fixedCols ? '100%' : `${width}px`,
              height: getFlexItemHeight(child)
            }"
          >
            <img :src="child[srcKey]" alt="" class="block h-full w-full" srcset="" />
          </div>
        </div>
        <div
          ref="loadMore"
          :style="{
            bottom: 0
          }"
          class="absolute h-40px w-full flex items-center justify-center"
        >
          {{ end ? endText : loadingText }}
        </div>
      </div>
    </template>
  </div>
</template>
