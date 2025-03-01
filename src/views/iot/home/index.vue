<template>
  <div class="min-h-full bg-gray-50">
    <el-space direction="vertical" :fill="true" size="small" class="w-full p-2">
      <!-- 统计卡片行 -->
      <el-row :gutter="16" class="mb-4">
        <el-col :span="6">
          <el-card class="stat-card" shadow="never">
            <div class="flex flex-col">
              <div class="flex justify-between items-center mb-1">
                <span class="text-gray-500 text-base font-medium">品类数量</span>
                <Icon icon="ep:menu" class="text-[32px] text-blue-400" />
              </div>
              <span class="text-3xl font-bold text-gray-700">{{ statsData.productCategoryCount }}</span>
              <el-divider class="my-2" />
              <div class="flex justify-between items-center text-gray-400 text-sm">
                <span>今日新增</span>
                <span class="text-green-500">↑ {{ statsData.productCategoryTodayCount }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="never">
            <div class="flex flex-col">
              <div class="flex justify-between items-center mb-1">
                <span class="text-gray-500 text-base font-medium">产品数量</span>
                <Icon icon="ep:box" class="text-[32px] text-orange-400" />
              </div>
              <span class="text-3xl font-bold text-gray-700">{{ statsData.productCount }}</span>
              <el-divider class="my-2" />
              <div class="flex justify-between items-center text-gray-400 text-sm">
                <span>今日新增</span>
                <span class="text-green-500">↑ {{ statsData.productTodayCount }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="never">
            <div class="flex flex-col">
              <div class="flex justify-between items-center mb-1">
                <span class="text-gray-500 text-base font-medium">设备数量</span>
                <Icon icon="ep:cpu" class="text-[32px] text-purple-400" />
              </div>
              <span class="text-3xl font-bold text-gray-700">{{ statsData.deviceCount }}</span>
              <el-divider class="my-2" />
              <div class="flex justify-between items-center text-gray-400 text-sm">
                <span>今日新增</span>
                <span class="text-green-500">↑ {{ statsData.deviceTodayCount }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="never">
            <div class="flex flex-col">
              <div class="flex justify-between items-center mb-1">
                <span class="text-gray-500 text-base font-medium">物模型消息</span>
                <Icon icon="ep:message" class="text-[32px] text-teal-400" />
              </div>
              <span class="text-3xl font-bold text-gray-700">{{ statsData.deviceMessageCount }}</span>
              <el-divider class="my-2" />
              <div class="flex justify-between items-center text-gray-400 text-sm">
                <span>今日新增</span>
                <span class="text-green-500">↑ {{ statsData.deviceMessageTodayCount }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 图表行 -->
      <el-row :gutter="16" class="mb-4">
        <el-col :span="12">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="flex items-center">
                <span class="text-base font-medium text-gray-600">设备数量统计</span>
              </div>
            </template>
            <div ref="chartDeviceNumStat" class="h-[240px]"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="flex items-center">
                <span class="text-base font-medium text-gray-600">设备状态统计</span>
              </div>
            </template>
            <el-row class="h-[240px]">
              <el-col :span="8" class="flex flex-col items-center">
                <div ref="chartDeviceOnline" class="h-[160px] w-full"></div>
                <div class="text-center mt-2">
                  <span class="text-sm text-gray-600">在线设备</span>
                </div>
              </el-col>
              <el-col :span="8" class="flex flex-col items-center">
                <div ref="chartDeviceOffline" class="h-[160px] w-full"></div>
                <div class="text-center mt-2">
                  <span class="text-sm text-gray-600">离线设备</span>
                </div>
              </el-col>
              <el-col :span="8" class="flex flex-col items-center">
                <div ref="chartDeviceActive" class="h-[160px] w-full"></div>
                <div class="text-center mt-2">
                  <span class="text-sm text-gray-600">待激活设备</span>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>

      <!-- 消息统计行 -->
      <el-row>
        <el-col :span="24">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="flex items-center justify-between">
                <span class="text-base font-medium text-gray-600">上下行消息量统计</span>
                <div class="flex items-center space-x-2">
                  <el-radio-group v-model="timeRange"  @change="handleTimeRangeChange">
                    <el-radio-button label="1h">最近1小时</el-radio-button>
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
            <div ref="chartMsgStat" class="h-[300px]"></div>
          </el-card>
        </el-col>
      </el-row>
    </el-space>
  </div>
</template>

<script setup lang="ts" name="Index">
import * as echarts from 'echarts/core'
import { TooltipComponent, LegendComponent, TitleComponent, ToolboxComponent, GridComponent } from 'echarts/components'
import { PieChart, LineChart, GaugeChart } from 'echarts/charts'
import { LabelLayout, UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import { ProductCategoryApi,IotStatisticsSummaryRespVO, IotStatisticsDeviceMessageSummaryRespVO} from '@/api/iot/statistics'
import { formatDate } from '@/utils/formatTime'
import { Icon } from '@/components/Icon'

/** IoT 首页 */
defineOptions({ name: 'IotHome' })

const timeRange = ref('7d') // 修改默认选择为近一周
const dateRange = ref<[Date, Date] | null>(null)

const queryParams = reactive({
  startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // 设置默认开始时间为7天前
  endTime: Date.now() // 设置默认结束时间为当前时间
})

echarts.use([
  TooltipComponent,
  LegendComponent,
  PieChart,
  CanvasRenderer,
  LabelLayout,
  TitleComponent,
  ToolboxComponent,
  GridComponent,
  LineChart,
  UniversalTransition,
  GaugeChart
])

const chartDeviceNumStat = ref()
const chartDeviceOnline = ref()
const chartDeviceOffline = ref()
const chartDeviceActive = ref()
const chartMsgStat = ref()


// 基础统计数据
const statsData = ref<IotStatisticsSummaryRespVO>({
  productCategoryCount: 0,
  productCount: 0,
  deviceCount: 0,
  deviceMessageCount: 0,
  productCategoryTodayCount: 0,
  productTodayCount: 0,
  deviceTodayCount: 0,
  deviceMessageTodayCount: 0,
  deviceOnlineCount: 0,
  deviceOfflineCount: 0,
  deviceInactiveCount: 0,
  productCategoryDeviceCounts: {}
})

// 消息统计数据
const messageStats = ref<IotStatisticsDeviceMessageSummaryRespVO>({
  upstreamCounts: {},
  downstreamCounts: {}
})

/** 处理快捷时间范围选择 */
const handleTimeRangeChange = (value: string) => {
  const now = Date.now()
  let startTime: number

  switch (value) {
    case '1h':
      startTime = now - 60 * 60 * 1000
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

  // 清空日期选择器
  dateRange.value = null
  
  // 更新查询参数
  queryParams.startTime = startTime
  queryParams.endTime = now
  
  // 重新获取数据
  getStats()
}

/** 处理自定义日期范围选择 */
const handleDateRangeChange = (value: [Date, Date] | null) => {
  if (value) {
    // 清空快捷选项
    timeRange.value = ''
    
    // 更新查询参数
    queryParams.startTime = value[0].getTime()
    queryParams.endTime = value[1].getTime()
    
    // 重新获取数据
    getStats()
  }
}

/** 获取统计数据 */
const getStats = async () => {
  // 获取基础统计数据
  const summaryRes = await ProductCategoryApi.getIotStatisticsSummary()
  statsData.value = summaryRes
  
  // 获取消息统计数据
  const messageRes = await ProductCategoryApi.getIotStatisticsDeviceMessageSummary(queryParams)
  messageStats.value = messageRes
  
  // 初始化图表
  initCharts()
}

/** 初始化图表 */
const initCharts = () => {
  // 设备数量统计
  echarts.init(chartDeviceNumStat.value).setOption({
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
        data: Object.entries(statsData.value.productCategoryDeviceCounts).map(([name, value]) => ({
          name,
          value
        }))
      }
    ]
  })

  // 在线设备统计
  initGaugeChart(chartDeviceOnline.value, statsData.value.deviceOnlineCount, '#0d9')

  // 离线设备统计
  initGaugeChart(chartDeviceOffline.value, statsData.value.deviceOfflineCount, '#f50')

  // 待激活设备统计
  initGaugeChart(chartDeviceActive.value, statsData.value.deviceInactiveCount, '#05b')

  // 消息量统计
  initMessageChart()
}

/** 初始化仪表盘图表 */
const initGaugeChart = (el: any, value: number, color: string) => {
  echarts.init(el).setOption({
    series: [
      {
        type: 'gauge',
        startAngle: 360,
        endAngle: 0,
        min: 0,
        max: statsData.value.deviceCount || 100, // 使用设备总数作为最大值
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
            return `${value}个`
          }
        },
        data: [{ value: value }]
      }
    ]
  })
}

/** 初始化消息统计图表 */
const initMessageChart = () => {
  // 获取所有时间戳并排序
  const timestamps = Array.from(
    new Set([
      ...messageStats.value.upstreamCounts.map(item => Number(Object.keys(item)[0])),
      ...messageStats.value.downstreamCounts.map(item => Number(Object.keys(item)[0]))
    ])
  ).sort((a, b) => a - b) // 确保时间戳从小到大排序

  // 准备数据
  const xdata = timestamps.map(ts => formatDate(ts, 'YYYY-MM-DD HH:mm'))
  const upData = timestamps.map(ts => {
    const item = messageStats.value.upstreamCounts.find(
      count => Number(Object.keys(count)[0]) === ts
    )
    return item ? Object.values(item)[0] : 0
  })
  const downData = timestamps.map(ts => {
    const item = messageStats.value.downstreamCounts.find(
      count => Number(Object.keys(count)[0]) === ts
    )
    return item ? Object.values(item)[0] : 0
  })

  // 配置图表
  echarts.init(chartMsgStat.value).setOption({
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
        smooth: true, // 添加平滑曲线
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
        smooth: true, // 添加平滑曲线
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

/** 初始化 */
onMounted(() => {
  if (document.getElementById('breadcrumb-container')) {
    document.getElementById('breadcrumb-container')!.style.display = 'none'
  }
  getStats()
})
</script>

<style lang="scss" scoped>
.stat-card {
  @apply bg-white rounded overflow-hidden;
  
  :deep(.el-card__body) {
    @apply p-3;
  }

  .el-divider {
    @apply my-2;
  }
}

.chart-card {
  @apply bg-white rounded overflow-hidden;
  
  :deep(.el-card__header) {
    @apply py-2 px-3 border-b border-gray-100 bg-white;
  }

  :deep(.el-card__body) {
    @apply p-3;
  }
}

// 修改图表配色方案，使其更加柔和
:deep(.echarts) {
  .tooltip {
    @apply bg-white/90 border border-gray-200 shadow-sm;
  }
  
  .axis-line {
    @apply text-gray-300;
  }
  
  .split-line {
    @apply text-gray-100;
  }
}

// 添加时间选择器样式
:deep(.el-radio-group) {
  @apply mr-4;
}

:deep(.el-date-editor) {
  @apply w-[360px];
}
</style>
