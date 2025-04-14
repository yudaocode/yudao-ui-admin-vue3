<template>
  <!-- 第一行：统计卡片行 -->
  <el-row :gutter="16" class="mb-4">
    <el-col :span="6">
      <ComparisonCard
        title="分类数量"
        :value="statsData.productCategoryCount"
        :todayCount="statsData.productCategoryTodayCount"
        icon="ep:menu"
        iconColor="text-blue-400"
      />
    </el-col>
    <el-col :span="6">
      <ComparisonCard
        title="产品数量"
        :value="statsData.productCount"
        :todayCount="statsData.productTodayCount"
        icon="ep:box"
        iconColor="text-orange-400"
      />
    </el-col>
    <el-col :span="6">
      <ComparisonCard
        title="设备数量"
        :value="statsData.deviceCount"
        :todayCount="statsData.deviceTodayCount"
        icon="ep:cpu"
        iconColor="text-purple-400"
      />
    </el-col>
    <el-col :span="6">
      <ComparisonCard
        title="设备消息数"
        :value="statsData.deviceMessageCount"
        :todayCount="statsData.deviceMessageTodayCount"
        icon="ep:message"
        iconColor="text-teal-400"
      />
    </el-col>
  </el-row>

  <!-- 第二行：图表行 -->
  <el-row :gutter="16" class="mb-4">
    <el-col :span="12">
      <DeviceCountCard :statsData="statsData" />
    </el-col>
    <el-col :span="12">
      <DeviceStateCountCard :statsData="statsData" />
    </el-col>
  </el-row>

  <!-- 第三行：消息统计行 -->
  <el-row>
    <el-col :span="24">
      <el-card class="chart-card" shadow="never">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-base font-medium text-gray-600">上下行消息量统计</span>
            <div class="flex items-center space-x-2">
              <el-radio-group v-model="timeRange" @change="handleTimeRangeChange">
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
        <div ref="deviceMessageCountChartRef" class="h-[300px]"></div>
      </el-card>
    </el-col>
  </el-row>

  <!-- TODO 第四行：地图 -->
</template>

<script setup lang="ts" name="Index">
import * as echarts from 'echarts/core'
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent
} from 'echarts/components'
import { GaugeChart, LineChart, PieChart } from 'echarts/charts'
import { LabelLayout, UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import {
  IotStatisticsDeviceMessageSummaryRespVO,
  IotStatisticsSummaryRespVO,
  ProductCategoryApi
} from '@/api/iot/statistics'
import { formatDate } from '@/utils/formatTime'
import ComparisonCard from './components/ComparisonCard.vue'
import DeviceCountCard from './components/DeviceCountCard.vue'
import DeviceStateCountCard from './components/DeviceStateCountCard.vue'

// TODO @super：参考下 /Users/yunai/Java/yudao-ui-admin-vue3/src/views/mall/home/index.vue，拆一拆组件

/** IoT 首页 */
defineOptions({ name: 'IoTHome' })

// TODO @super：使用下 Echart 组件，参考 yudao-ui-admin-vue3/src/views/mall/home/components/TradeTrendCard.vue 等
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

const timeRange = ref('7d') // 修改默认选择为近一周
const dateRange = ref<[Date, Date] | null>(null)

const queryParams = reactive({
  startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // 设置默认开始时间为 7 天前
  endTime: Date.now() // 设置默认结束时间为当前时间
})

const deviceCountChartRef = ref() // 设备数量统计的图表
const deviceOnlineCountChartRef = ref() // 在线设备统计的图表
const deviceOfflineChartRef = ref() // 离线设备统计的图表
const deviceActiveChartRef = ref() // 待激活设备统计的图表
const deviceMessageCountChartRef = ref() // 上下行消息量统计的图表

// 基础统计数据
// TODO @super：初始为 -1，然后界面展示先是加载中？试试用 cursor 改哈
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
const handleTimeRangeChange = (timeRange: string) => {
  const now = Date.now()
  let startTime: number

  // TODO @super：这个的计算，看看能不能结合 dayjs 简化。因为 1h、24h、7d 感觉是比较标准的。如果没有，抽到 utils/formatTime.ts 作为一个工具方法
  switch (timeRange) {
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
  statsData.value = await ProductCategoryApi.getIotStatisticsSummary()

  // 获取消息统计数据
  messageStats.value = await ProductCategoryApi.getIotStatisticsDeviceMessageSummary(queryParams)

  // 初始化图表
  initCharts()
}

/** 初始化图表 */
const initCharts = () => {
  // 消息量统计
  initMessageChart()
}

/** 初始化消息统计图表 */
const initMessageChart = () => {
  // 获取所有时间戳并排序
  // TODO @super：一些 idea 里的红色报错，要去处理掉噢。
  const timestamps = Array.from(
    new Set([
      ...messageStats.value.upstreamCounts.map((item) => Number(Object.keys(item)[0])),
      ...messageStats.value.downstreamCounts.map((item) => Number(Object.keys(item)[0]))
    ])
  ).sort((a, b) => a - b) // 确保时间戳从小到大排序

  // 准备数据
  const xdata = timestamps.map((ts) => formatDate(ts, 'YYYY-MM-DD HH:mm'))
  const upData = timestamps.map((ts) => {
    const item = messageStats.value.upstreamCounts.find(
      (count) => Number(Object.keys(count)[0]) === ts
    )
    return item ? Object.values(item)[0] : 0
  })
  const downData = timestamps.map((ts) => {
    const item = messageStats.value.downstreamCounts.find(
      (count) => Number(Object.keys(count)[0]) === ts
    )
    return item ? Object.values(item)[0] : 0
  })

  // 配置图表
  echarts.init(deviceMessageCountChartRef.value).setOption({
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
  getStats()
})
</script>

<style lang="scss" scoped></style>
