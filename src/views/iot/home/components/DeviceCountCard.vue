<template>
  <el-card class="chart-card" shadow="never" :loading="loading">
    <template #header>
      <div class="flex items-center">
        <span class="text-base font-medium text-gray-600">设备数量统计</span>
      </div>
    </template>
    <div v-if="loading && !hasData" class="h-[240px] flex justify-center items-center">
      <el-empty description="加载中..." />
    </div>
    <div v-else-if="!hasData" class="h-[240px] flex justify-center items-center">
      <el-empty description="暂无数据" />
    </div>
    <div v-else ref="deviceCountChartRef" class="h-[240px]"></div>
  </el-card>
</template>

<script lang="ts" setup>
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { LabelLayout } from 'echarts/features'
import { IotStatisticsSummaryRespVO } from '@/api/iot/statistics'
import type { PropType } from 'vue'

/** 【设备数量】统计卡片 */
defineOptions({ name: 'DeviceCountCard' })

const props = defineProps({
  statsData: {
    type: Object as PropType<IotStatisticsSummaryRespVO>,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const deviceCountChartRef = ref()

/** 是否有数据 */
const hasData = computed(() => {
  if (!props.statsData) return false

  const categories = Object.entries(props.statsData.productCategoryDeviceCounts || {})
  return categories.length > 0 && props.statsData.deviceCount !== -1
})

/** 初始化图表 */
const initChart = () => {
  // 如果没有数据，则不初始化图表
  if (!hasData.value) return
  // 确保 DOM 元素存在且已渲染
  if (!deviceCountChartRef.value) {
    console.warn('图表DOM元素不存在')
    return
  }

  echarts.use([TooltipComponent, LegendComponent, PieChart, CanvasRenderer, LabelLayout])
  try {
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
          data: Object.entries(props.statsData.productCategoryDeviceCounts).map(
            ([name, value]) => ({
              name,
              value
            })
          )
        }
      ]
    })
    return chart
  } catch (error) {
    console.error('初始化图表失败:', error)
    return null
  }
}

/** 监听数据变化 */
watch(
  () => props.statsData,
  () => {
    // 使用 nextTick 确保 DOM 已更新
    nextTick(() => {
      initChart()
    })
  },
  { deep: true }
)

/** 组件挂载时初始化图表 */
onMounted(async () => {
  // 使用 nextTick 确保 DOM 已更新
  await nextTick(() => {
    initChart()
  })
})
</script>
