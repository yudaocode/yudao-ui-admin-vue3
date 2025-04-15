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
import { formatDate, getTimeRangeStart } from '@/utils/formatTime'
import type { PropType } from 'vue'
import dayjs from 'dayjs'

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
const dateRange = ref<any>(null)
const messageChartRef = ref()

// TODO @super：这个的计算，看看能不能结合 dayjs 简化。因为 1h、24h、7d 感觉是比较标准的。如果没有，抽到 utils/formatTime.ts 作为一个工具方法
// 处理快捷时间范围选择
const handleTimeRangeChange = (range: string) => {
  const now = dayjs().valueOf()
  const startTime = getTimeRangeStart(range as '8h' | '24h' | '7d')

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


  // 检查数据格式并转换
  const upstreamCounts = Array.isArray(props.messageStats.upstreamCounts) 
    ? props.messageStats.upstreamCounts 
    : Object.entries(props.messageStats.upstreamCounts || {}).map(([key, value]) => ({ [key]: value }))
  
  const downstreamCounts = Array.isArray(props.messageStats.downstreamCounts) 
    ? props.messageStats.downstreamCounts 
    : Object.entries(props.messageStats.downstreamCounts || {}).map(([key, value]) => ({ [key]: value }))

  // 获取所有时间戳并排序
  let timestamps: number[] = []
  
  try {
    // 尝试从数组中提取时间戳
    if (Array.isArray(upstreamCounts) && upstreamCounts.length > 0) {
      timestamps = Array.from(
        new Set([
          ...upstreamCounts.map(item => Number(Object.keys(item)[0])),
          ...downstreamCounts.map(item => Number(Object.keys(item)[0]))
        ])
      ).sort((a, b) => a - b)
    } else {
      // 如果数组为空或不是数组，尝试从对象中提取时间戳
      const upKeys = Object.keys(props.messageStats.upstreamCounts || {}).map(Number)
      const downKeys = Object.keys(props.messageStats.downstreamCounts || {}).map(Number)
      timestamps = Array.from(new Set([...upKeys, ...downKeys])).sort((a, b) => a - b)
    }
  } catch (error) {
    console.error('提取时间戳出错:', error)
    timestamps = []
  }


  // 准备数据
  const xdata = timestamps.map((ts) => formatDate(dayjs(ts).toDate(), 'YYYY-MM-DD HH:mm'))
  
  let upData: number[] = []
  let downData: number[] = []
  
  try {
    // 尝试从数组中提取数据
    if (Array.isArray(upstreamCounts) && upstreamCounts.length > 0) {
      upData = timestamps.map((ts) => {
        const item = upstreamCounts.find(count => 
          Number(Object.keys(count)[0]) === ts
        )
        return item ? Number(Object.values(item)[0]) : 0
      })
      
      downData = timestamps.map((ts) => {
        const item = downstreamCounts.find(count => 
          Number(Object.keys(count)[0]) === ts
        )
        return item ? Number(Object.values(item)[0]) : 0
      })
    } else {
      // 如果数组为空或不是数组，尝试从对象中提取数据
      const upstreamObj = props.messageStats.upstreamCounts || {}
      const downstreamObj = props.messageStats.downstreamCounts || {}
      upData = timestamps.map((ts) => Number(upstreamObj[ts as keyof typeof upstreamObj] || 0))
      downData = timestamps.map((ts) => Number(downstreamObj[ts as keyof typeof downstreamObj] || 0))
    }
  } catch (error) {
    console.error('提取数据出错:', error)
    upData = []
    downData = []
  }


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
