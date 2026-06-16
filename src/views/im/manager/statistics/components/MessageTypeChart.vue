<template>
  <el-card shadow="never" class="!rounded-8px mb-16px">
    <template #header>内容类型分布</template>
    <div ref="chartRef" v-loading="loading" style="width: 100%; height: 320px"></div>
  </el-card>
</template>

<script lang="ts" setup>
import * as echarts from 'echarts'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import * as StatisticsApi from '@/api/im/manager/statistics'

defineOptions({ name: 'ImStatisticsMessageTypeChart' })

const chartRef = ref<HTMLElement>()
const loading = ref(false)
let chart: echarts.ECharts | null = null

/** 渲染饼图：type 在前端按字典翻译为名称给 echarts */
const render = (data: StatisticsApi.ImStatisticsMessageTypeVO[]) => {
  const items = data.map((d) => ({
    name: getDictLabel(DICT_TYPE.IM_CONTENT_TYPE, d.type) || `未知(${d.type})`,
    value: d.value
  }))
  chart?.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 8, top: 'middle' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: items
      }
    ]
  })
}

/** 拉取并渲染数据 */
const loadData = async () => {
  loading.value = true
  try {
    const data = await StatisticsApi.getMessageTypeDistribution()
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
