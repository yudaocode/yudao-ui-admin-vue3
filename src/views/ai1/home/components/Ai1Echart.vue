<template>
  <div ref="elRef" :style="{ width: '100%', height: `${height}px` }"></div>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import echarts from '@/plugins/echarts'
import { useAppStore } from '@/store/modules/app'

/** AI1 首页图表：随容器变化调整尺寸，卸载时释放实例。 */
defineOptions({ name: 'Ai1Echart' })

const props = withDefaults(defineProps<{ options: EChartsOption; height?: number }>(), {
  height: 320
})
const appStore = useAppStore()
const elRef = ref<HTMLElement>()
let chart: echarts.ECharts | undefined
let observer: ResizeObserver | undefined

const options = computed<EChartsOption>(() => ({
  ...props.options,
  darkMode: appStore.getIsDark ? true : 'auto'
}))
const resize = () => chart?.resize()

onMounted(() => {
  if (!elRef.value) return
  chart = echarts.init(elRef.value)
  chart.setOption(options.value)
  observer = new ResizeObserver(resize)
  observer.observe(elRef.value)
})

watch(options, (value) => chart?.setOption(value), { deep: true })

onDeactivated(() => observer?.disconnect())
onActivated(() => {
  if (elRef.value) observer?.observe(elRef.value)
  resize()
})
onBeforeUnmount(() => {
  observer?.disconnect()
  observer = undefined
  chart?.dispose()
  chart = undefined
})
</script>
