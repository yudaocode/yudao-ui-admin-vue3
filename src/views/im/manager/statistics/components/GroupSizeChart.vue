<template>
  <el-card shadow="never" class="chart-card">
    <template #header>群规模分布</template>
    <div ref="chartRef" style="width: 100%; height: 320px"></div>
  </el-card>
</template>

<script lang="ts" setup>
import * as echarts from 'echarts'

defineOptions({ name: 'ImStatisticsGroupSizeChart' })

const props = defineProps<{ data: { range: string; count: number }[] }>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const render = () => {
  if (!chart) return
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 30, containLabel: true },
    xAxis: { type: 'category', data: props.data.map((d) => d.range) },
    yAxis: { type: 'value', name: '群组数' },
    series: [{
      type: 'bar',
      data: props.data.map((d) => d.count),
      itemStyle: { color: '#67C23A', borderRadius: [4, 4, 0, 0] },
      barMaxWidth: 48
    }]
  })
}

onMounted(async () => {
  await nextTick()
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    render()
  }
})
watch(() => props.data, render, { deep: true })
onUnmounted(() => chart?.dispose())
</script>

<style scoped>
.chart-card { border-radius: 8px; margin-bottom: 16px; }
</style>
