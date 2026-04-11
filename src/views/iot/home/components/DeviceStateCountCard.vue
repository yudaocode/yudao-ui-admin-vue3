<template>
  <el-card class="chart-card" shadow="never" :loading="loading">
    <template #header>
      <div class="flex items-center">
        <span class="text-base font-medium text-gray-600">设备状态统计</span>
      </div>
    </template>
    <div v-if="loading && !hasData" class="h-[240px] flex justify-center items-center">
      <el-empty description="加载中..." />
    </div>
    <div v-else-if="!hasData" class="h-[240px] flex justify-center items-center">
      <el-empty description="暂无数据" />
    </div>
    <el-row v-else class="h-[240px]">
      <el-col :span="8" class="flex flex-col items-center">
        <div ref="deviceOnlineCountChartRef" class="h-[160px] w-full"></div>
        <div class="text-center mt-2">
          <span class="text-sm text-gray-600">在线设备</span>
        </div>
      </el-col>
      <el-col :span="8" class="flex flex-col items-center">
        <div ref="deviceOfflineChartRef" class="h-[160px] w-full"></div>
        <div class="text-center mt-2">
          <span class="text-sm text-gray-600">离线设备</span>
        </div>
      </el-col>
      <el-col :span="8" class="flex flex-col items-center">
        <div ref="deviceActiveChartRef" class="h-[160px] w-full"></div>
        <div class="text-center mt-2">
          <span class="text-sm text-gray-600">待激活设备</span>
        </div>
      </el-col>
    </el-row>
  </el-card>
</template>

<script lang="ts" setup>
import * as echarts from 'echarts/core'
import { GaugeChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { IotStatisticsSummaryRespVO } from '@/api/iot/statistics'
import type { PropType } from 'vue'

/** 【设备状态】统计卡片 */
defineOptions({ name: 'DeviceStateCountCard' })

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

const deviceOnlineCountChartRef = ref()
const deviceOfflineChartRef = ref()
const deviceActiveChartRef = ref()

/** 是否有数据 */
const hasData = computed(() => {
  if (!props.statsData) return false
  return props.statsData.deviceCount !== -1
})

/** 初始化仪表盘图表 */
const initGaugeChart = (el: any, value: number, color: string) => {
  // 确保 DOM 元素存在且已渲染
  if (!el) {
    console.warn('图表DOM元素不存在')
    return
  }

  echarts.use([GaugeChart, CanvasRenderer])
  try {
    const chart = echarts.init(el)
    chart.setOption({
      series: [
        {
          type: 'gauge',
          startAngle: 360,
          endAngle: 0,
          min: 0,
          max: props.statsData.deviceCount || 100, // 使用设备总数作为最大值
          progress: {
            show: true,
            width: 12,
            itemStyle: {
              color: color
            }
          },
          axisLine: {
            lineStyle: {
              width: 12,
              color: [[1, '#E5E7EB']]
            }
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          pointer: { show: false },
          anchor: { show: false },
          title: { show: false },
          detail: {
            valueAnimation: true,
            fontSize: 24,
            fontWeight: 'bold',
            fontFamily: 'Inter, sans-serif',
            color: color,
            offsetCenter: [0, '0'],
            formatter: (value: number) => {
              return `${value} 个`
            }
          },
          data: [{ value: value }]
        }
      ]
    })
    return chart
  } catch (error) {
    console.error('初始化图表失败:', error)
    return null
  }
}

/** 初始化所有图表 */
const initCharts = () => {
  // 如果没有数据，则不初始化图表
  if (!hasData.value) return

  // 使用 nextTick 确保 DOM 已更新
  nextTick(() => {
    // 在线设备统计
    if (deviceOnlineCountChartRef.value) {
      initGaugeChart(deviceOnlineCountChartRef.value, props.statsData.deviceOnlineCount, '#0d9')
    }
    // 离线设备统计
    if (deviceOfflineChartRef.value) {
      initGaugeChart(deviceOfflineChartRef.value, props.statsData.deviceOfflineCount, '#f50')
    }
    // 待激活设备统计
    if (deviceActiveChartRef.value) {
      initGaugeChart(deviceActiveChartRef.value, props.statsData.deviceInactiveCount, '#05b')
    }
  })
}

/** 监听数据变化 */
watch(
  () => props.statsData,
  () => {
    initCharts()
  },
  { deep: true }
)

/** 组件挂载时初始化图表 */
onMounted(() => {
  initCharts()
})
</script>
