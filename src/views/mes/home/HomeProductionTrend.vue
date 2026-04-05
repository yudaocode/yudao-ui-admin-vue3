<!-- TODO @AI：补充一些注释 -->
<template>
  <el-card shadow="hover">
    <template #header>
      <div class="flex justify-between items-center">
        <span class="text-16px font-600">生产趋势</span>
        <el-radio-group v-model="trendDays" size="small" @change="loadData">
          <el-radio-button :value="7">近 7 天</el-radio-button>
          <el-radio-button :value="30">近 30 天</el-radio-button>
        </el-radio-group>
      </div>
    </template>
    <Echart :options="trendChartOptions" :height="320" />
  </el-card>
</template>

<script lang="ts" setup>
import { EChartsOption } from 'echarts'
import { MesHomeStatisticsApi, MesHomeProductionTrendVO } from '@/api/mes/home'

defineOptions({ name: 'HomeProductionTrend' })

const trendDays = ref(7)
const trendChartOptions = reactive<EChartsOption>({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' }
  },
  legend: { data: ['产量', '合格品', '不良品'], bottom: 0 },
  grid: { left: 50, right: 20, top: 20, bottom: 40 },
  xAxis: { type: 'category', data: [], boundaryGap: false },
  yAxis: { type: 'value', minInterval: 1 },
  series: [
    {
      name: '产量',
      type: 'line',
      smooth: true,
      data: [],
      itemStyle: { color: '#409EFF' },
      areaStyle: { color: 'rgba(64,158,255,0.15)' }
    },
    {
      name: '合格品',
      type: 'line',
      smooth: true,
      data: [],
      itemStyle: { color: '#67C23A' }
    },
    {
      name: '不良品',
      type: 'line',
      smooth: true,
      data: [],
      itemStyle: { color: '#F56C6C' }
    }
  ]
}) as EChartsOption

const loadData = async () => {
  const data: MesHomeProductionTrendVO[] = await MesHomeStatisticsApi.getProductionTrend(
    trendDays.value
  )
  const dates = data.map((d) => d.date.substring(5))
  const quantities = data.map((d) => d.quantity)
  const qualified = data.map((d) => d.qualifiedQuantity)
  const unqualified = data.map((d) => d.unqualifiedQuantity)
  ;(trendChartOptions as any).xAxis.data = dates
  ;(trendChartOptions as any).series[0].data = quantities
  ;(trendChartOptions as any).series[1].data = qualified
  ;(trendChartOptions as any).series[2].data = unqualified
}

/** 暴露加载方法供父组件调用 */
defineExpose({ loadData })
</script>
