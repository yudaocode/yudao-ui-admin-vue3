<template>
  <el-card shadow="never" class="!rounded-8px mb-16px">
    <template #header>
      <div class="flex justify-between items-center">
        <span>消息趋势（私聊 + 群聊）</span>
        <el-select v-model="days" @change="loadData" style="width: 100px" size="small">
          <el-option label="近 7 天" :value="7" />
          <el-option label="近 15 天" :value="15" />
          <el-option label="近 30 天" :value="30" />
        </el-select>
      </div>
    </template>
    <div ref="chartRef" v-loading="loading" style="width: 100%; height: 320px"></div>
  </el-card>
</template>

<script lang="ts" setup>
import * as echarts from 'echarts'
import * as StatisticsApi from '@/api/im/manager/statistics'

defineOptions({ name: 'ImStatisticsMessageTrendChart' })

const chartRef = ref<HTMLElement>()
const days = ref(7)
const loading = ref(false)
let chart: echarts.ECharts | null = null

const buildOption = (
  dates: string[],
  priv: number[],
  grp: number[]
): echarts.EChartsCoreOption => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['私聊消息', '群聊消息'], top: 0 },
  grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
  xAxis: {
    type: 'category',
    data: dates,
    axisLabel: { formatter: (v: string) => v.slice(5, 10) }
  },
  yAxis: { type: 'value', name: '消息量' },
  series: [
    {
      name: '私聊消息',
      type: 'line',
      smooth: true,
      data: priv,
      itemStyle: { color: '#409EFF' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64,158,255,0.35)' },
            { offset: 1, color: 'rgba(64,158,255,0.05)' }
          ]
        }
      }
    },
    {
      name: '群聊消息',
      type: 'line',
      smooth: true,
      data: grp,
      itemStyle: { color: '#67C23A' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(103,194,58,0.35)' },
            { offset: 1, color: 'rgba(103,194,58,0.05)' }
          ]
        }
      }
    }
  ]
})

const loadData = async () => {
  loading.value = true
  try {
    const data = await StatisticsApi.getMessageTrend(days.value)
    chart?.setOption(buildOption(data.dates, data.series.private || [], data.series.group || []))
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
