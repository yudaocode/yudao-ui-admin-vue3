<template>
  <el-card shadow="never" class="!rounded-8px mb-16px">
    <template #header>群规模分布</template>
    <div ref="chartRef" v-loading="loading" style="width: 100%; height: 320px"></div>
  </el-card>
</template>

<script lang="ts" setup>
import * as echarts from 'echarts'
import * as StatisticsApi from '@/api/im/manager/statistics'

defineOptions({ name: 'ImStatisticsGroupSizeChart' })

const chartRef = ref<HTMLElement>()
const loading = ref(false)
let chart: echarts.ECharts | null = null

/** 渲染柱状图 */
const render = (data: StatisticsApi.ImStatisticsGroupSizeVO[]) => {
  chart?.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 30, containLabel: true },
    xAxis: { type: 'category', data: data.map((d) => d.range) },
    yAxis: { type: 'value', name: '群组数' },
    series: [
      {
        type: 'bar',
        data: data.map((d) => d.count),
        itemStyle: { color: '#67C23A', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 48
      }
    ]
  })
}

/** 拉取并渲染数据 */
const loadData = async () => {
  loading.value = true
  try {
    const data = await StatisticsApi.getGroupSizeDistribution()
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
