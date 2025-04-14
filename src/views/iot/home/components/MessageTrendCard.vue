<template>
  <el-card class="chart-card" shadow="never">
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-base font-medium text-gray-600">上下行消息量统计</span>
        <div class="flex items-center space-x-2">
          <el-radio-group v-model="timeRange" @change="handleTimeRangeChange">
            <el-radio-button label="8h">最近8小时</el-radio-button>
            <el-radio-button label="24h">最近24小时</el-radio-button>
            <el-radio-button label="7d">近一周</el-radio-button>
          </el-radio-group>
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
            @change="handleDateRangeChange"
          />
        </div>
      </div>
    </template>
    <div ref="messageChartRef" class="h-[300px]"></div>
  </el-card>
</template>

<script lang="ts" setup>
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { UniversalTransition } from 'echarts/features'
import { IotStatisticsDeviceMessageSummaryRespVO } from '@/api/iot/statistics'
import { formatDate } from '@/utils/formatTime'
import type { PropType } from 'vue'

/** 消息趋势统计卡片 */
defineOptions({ name: 'MessageTrendCard' })

const props = defineProps({
  messageStats: {
    type: Object as PropType<IotStatisticsDeviceMessageSummaryRespVO>,
    required: true
  }
})

const emit = defineEmits(['timeRangeChange'])

const timeRange = ref('7d')
const dateRange = ref<[Date, Date] | null>(null)
const messageChartRef = ref()

// 处理快捷时间范围选择
const handleTimeRangeChange = (range: string) => {
  const now = Date.now()
  let startTime: number

  switch (range) {
    case '8h':
      startTime = now - 8 * 60 * 60 * 1000
      break
    case '24h':
      startTime = now - 24 * 60 * 60 * 1000
      break
    case '7d':
      startTime = now - 7 * 24 * 60 * 60 * 1000
      break
    default:
      return
  }

  dateRange.value = null
  emit('timeRangeChange', { startTime, endTime: now })
}

// 处理自定义日期范围选择
const handleDateRangeChange = (value: [Date, Date] | null) => {
  if (value) {
    timeRange.value = ''
    emit('timeRangeChange', {
      startTime: value[0].getTime(),
      endTime: value[1].getTime()
    })
  }
}

// 初始化图表
const initChart = () => {
  echarts.use([
    LineChart,
    CanvasRenderer,
    GridComponent,
    LegendComponent,
    TooltipComponent,
    UniversalTransition
  ])

  const timestamps = Array.from(
    new Set([
      ...props.messageStats.upstreamCounts.map((item) => Number(Object.keys(item)[0])),
      ...props.messageStats.downstreamCounts.map((item) => Number(Object.keys(item)[0]))
    ])
  ).sort((a, b) => a - b) // 确保时间戳从小到大排序

  // 准备数据
  const xdata = timestamps.map((ts) => formatDate(ts, 'YYYY-MM-DD HH:mm'))
  const upData = timestamps.map((ts) => {
    const item = props.messageStats.upstreamCounts.find(
      (count) => Number(Object.keys(count)[0]) === ts
    )
    return item ? Object.values(item)[0] : 0
  })
  const downData = timestamps.map((ts) => {
    const item = props.messageStats.downstreamCounts.find(
      (count) => Number(Object.keys(count)[0]) === ts
    )
    return item ? Object.values(item)[0] : 0
  })

  // 获取所有时间戳并排序

  console.log(xdata, upData, downData)

  // 配置图表
  const chart = echarts.init(messageChartRef.value)
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#E5E7EB',
      textStyle: {
        color: '#374151'
      }
    },
    legend: {
      data: ['上行消息量', '下行消息量'],
      textStyle: {
        color: '#374151',
        fontWeight: 500
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xdata,
      axisLine: {
        lineStyle: {
          color: '#E5E7EB'
        }
      },
      axisLabel: {
        color: '#6B7280'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#E5E7EB'
        }
      },
      axisLabel: {
        color: '#6B7280'
      },
      splitLine: {
        lineStyle: {
          color: '#F3F4F6'
        }
      }
    },
    series: [
      {
        name: '上行消息量',
        type: 'line',
        smooth: true,
        data: upData,
        itemStyle: {
          color: '#3B82F6'
        },
        lineStyle: {
          width: 2
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0)' }
          ])
        }
      },
      {
        name: '下行消息量',
        type: 'line',
        smooth: true,
        data: downData,
        itemStyle: {
          color: '#10B981'
        },
        lineStyle: {
          width: 2
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.2)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0)' }
          ])
        }
      }
    ]
  })
}

// 监听数据变化
watch(
  () => props.messageStats,
  () => {
    initChart()
  },
  { deep: true }
)

// 组件挂载时初始化图表
onMounted(() => {
  initChart()
})
</script>
