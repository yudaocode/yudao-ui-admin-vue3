<template>
  <el-card shadow="never" class="!rounded-8px mb-16px">
    <template #header>
      <div class="flex justify-between items-center">
        <span>用户趋势（新增注册 + 日活）</span>
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

defineOptions({ name: 'ImStatisticsUserTrendChart' })

const chartRef = ref<HTMLElement>()
const days = ref(7)
const loading = ref(false)
let chart: echarts.ECharts | null = null

const buildOption = (dates: string[], reg: number[], act: number[]): echarts.EChartsCoreOption => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['新增注册', '日活'], top: 0 },
  grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
  xAxis: {
    type: 'category',
    data: dates,
    axisLabel: { formatter: (v: string) => v.slice(5, 10) }
  },
  yAxis: [
    { type: 'value', name: '新增注册', position: 'left' },
    { type: 'value', name: '日活', position: 'right' }
  ],
  series: [
    {
      name: '新增注册',
      type: 'bar',
      yAxisIndex: 0,
      data: reg,
      itemStyle: { color: '#E6A23C' },
      barMaxWidth: 24
    },
    {
      name: '日活',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      data: act,
      itemStyle: { color: '#F56C6C' }
    }
  ]
})

const loadData = async () => {
  loading.value = true
  try {
    const data = await StatisticsApi.getUserTrend(days.value)
    chart?.setOption(buildOption(data.dates, data.series.register || [], data.series.active || []))
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
