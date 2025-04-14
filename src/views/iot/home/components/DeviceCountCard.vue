<template>
  <el-card class="chart-card" shadow="never">
    <template #header>
      <div class="flex items-center">
        <span class="text-base font-medium text-gray-600">设备数量统计</span>
      </div>
    </template>
    <div ref="deviceCountChartRef" class="h-[240px]"></div>
  </el-card>
</template>

<script lang="ts" setup>
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { LabelLayout } from 'echarts/features'
import { IotStatisticsSummaryRespVO } from '@/api/iot/statistics'

/** 设备数量统计卡片 */
defineOptions({ name: 'DeviceCountCard' })

const props = defineProps({
  statsData: {
    type: Object as PropType<IotStatisticsSummaryRespVO>,
    required: true
  }
})

const deviceCountChartRef = ref()

// 初始化图表
const initChart = () => {
  echarts.use([TooltipComponent, LegendComponent, PieChart, CanvasRenderer, LabelLayout])
  
  const chart = echarts.init(deviceCountChartRef.value)
  chart.setOption({
    tooltip: {
      trigger: 'item'
    },
    legend: {
      top: '5%',
      right: '10%',
      align: 'left',
      orient: 'vertical',
      icon: 'circle'
    },
    series: [
      {
        name: 'Access From',
        type: 'pie',
        radius: ['50%', '80%'],
        avoidLabelOverlap: false,
        center: ['30%', '50%'],
        label: {
          show: false,
          position: 'outside'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: Object.entries(props.statsData.productCategoryDeviceCounts).map(([name, value]) => ({
          name,
          value
        }))
      }
    ]
  })
}

// 监听数据变化
watch(() => props.statsData, () => {
  initChart()
}, { deep: true })

// 组件挂载时初始化图表
onMounted(() => {
  initChart()
})
</script>
