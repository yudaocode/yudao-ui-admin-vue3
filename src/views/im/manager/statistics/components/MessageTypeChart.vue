<template>
  <el-card shadow="never" class="chart-card">
    <template #header>消息类型分布</template>
    <div ref="chartRef" style="width: 100%; height: 320px"></div>
  </el-card>
</template>

<script lang="ts" setup>
import * as echarts from 'echarts'

defineOptions({ name: 'ImStatisticsMessageTypeChart' })

const props = defineProps<{ data: { name: string; value: number }[] }>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const render = () => {
  if (!chart) return
  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 8, top: 'middle' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      data: props.data
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
