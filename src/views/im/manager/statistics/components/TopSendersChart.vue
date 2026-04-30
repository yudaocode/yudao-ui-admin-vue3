<template>
  <el-card shadow="never" class="chart-card">
    <template #header>消息发送 TOP 10</template>
    <div ref="chartRef" style="width: 100%; height: 320px"></div>
  </el-card>
</template>

<script lang="ts" setup>
import * as echarts from 'echarts'

defineOptions({ name: 'ImStatisticsTopSendersChart' })

const props = defineProps<{
  data: { userId: number; nickname: string; messageCount: number }[]
}>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const render = () => {
  if (!chart) return
  // 横向条形图：从下到上排名
  const sorted = [...props.data].sort((a, b) => a.messageCount - b.messageCount)
  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 20, containLabel: true },
    xAxis: { type: 'value', name: '消息数' },
    yAxis: {
      type: 'category',
      data: sorted.map((d) => `${d.nickname}(${d.userId})`),
      axisLabel: { width: 110, overflow: 'truncate' }
    },
    series: [{
      type: 'bar',
      data: sorted.map((d) => d.messageCount),
      itemStyle: { color: '#409EFF', borderRadius: [0, 4, 4, 0] },
      barMaxWidth: 18
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
