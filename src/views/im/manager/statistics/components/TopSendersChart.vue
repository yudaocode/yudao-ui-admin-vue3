<template>
  <el-card shadow="never" class="!rounded-8px mb-16px">
    <template #header>消息发送 TOP 10</template>
    <div ref="chartRef" v-loading="loading" style="width: 100%; height: 320px"></div>
  </el-card>
</template>

<script lang="ts" setup>
import * as echarts from 'echarts'
import * as StatisticsApi from '@/api/im/manager/statistics'

defineOptions({ name: 'ImStatisticsTopSendersChart' })

const chartRef = ref<HTMLElement>()
const loading = ref(false)
let chart: echarts.ECharts | null = null

/** 渲染横向条形图（从下到上排名） */
const render = (data: StatisticsApi.ImStatisticsTopSenderVO[]) => {
  const sorted = [...data].sort((a, b) => a.messageCount - b.messageCount)
  chart?.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 20, containLabel: true },
    xAxis: { type: 'value', name: '消息数' },
    yAxis: {
      type: 'category',
      data: sorted.map((d) => `${d.nickname || d.userId}(${d.userId})`),
      axisLabel: { width: 110, overflow: 'truncate' }
    },
    series: [
      {
        type: 'bar',
        data: sorted.map((d) => d.messageCount),
        itemStyle: { color: '#409EFF', borderRadius: [0, 4, 4, 0] },
        barMaxWidth: 18
      }
    ]
  })
}

/** 拉取并渲染数据 */
const loadData = async () => {
  loading.value = true
  try {
    const data = await StatisticsApi.getTopSenders()
    render(data)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await nextTick()
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    await loadData()
  }
})
onUnmounted(() => chart?.dispose())
</script>
