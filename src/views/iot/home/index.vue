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
              <span class="text-3xl font-bold text-gray-700">{{ statsData.categoryTotal }}</span>
              <el-divider class="my-2" />
              <div class="flex justify-between items-center text-gray-400 text-sm">
                <span>今日新增</span>
                <span class="text-green-500">↑ 0</span>
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
              <span class="text-3xl font-bold text-gray-700">{{ statsData.productTotal }}</span>
              <el-divider class="my-2" />
              <div class="flex justify-between items-center text-gray-400 text-sm">
                <span>今日新增</span>
                <span class="text-green-500">↑ 0</span>
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
              <span class="text-3xl font-bold text-gray-700">{{ statsData.deviceTotal }}</span>
              <el-divider class="my-2" />
              <div class="flex justify-between items-center text-gray-400 text-sm">
                <span>今日新增</span>
                <span class="text-green-500">↑ 0</span>
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
              <span class="text-3xl font-bold text-gray-700">{{ statsData.reportTotal }}</span>
              <el-divider class="my-2" />
              <div class="flex justify-between items-center text-gray-400 text-sm">
                <span>今日新增</span>
                <span class="text-green-500">↑ 0</span>
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
              <div class="flex items-center">
                <span class="text-base font-medium text-gray-600">消息量统计</span>
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
import { ProductCategoryApi } from '@/api/iot/statistics'
import { formatDate } from '@/utils/formatTime'
import { Icon } from '@/components/Icon'

/** IoT 首页 */
defineOptions({ name: 'IotHome' })

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

const statsData = ref({
  categoryTotal: 0,
  productTotal: 0,
  deviceTotal: 0,
  reportTotal: 0,
  onlineTotal: 0,
  offlineTotal: 0,
  neverOnlineTotal: 0,
  deviceStatsOfCategory: [],
  reportDataStats: []
})

/** 获取统计数据 */
const getStats = async () => {
  const res = await ProductCategoryApi.getIotMainStats()
  statsData.value = res
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
        data: statsData.value.deviceStatsOfCategory
      }
    ]
  })

  // 在线设备统计
  initGaugeChart(chartDeviceOnline.value, statsData.value.onlineTotal, '#0d9')

  // 离线设备统计
  initGaugeChart(chartDeviceOffline.value, statsData.value.offlineTotal, '#f50')

  // 待激活设备统计
  initGaugeChart(chartDeviceActive.value, statsData.value.neverOnlineTotal, '#05b')

  // 消息量统计
  initMessageChart()
}

/** 初始化仪表盘图表 */
const initGaugeChart = (el: any, value: number, color: string) => {
  // 计算百分比，保留1位小数
  const percentage = statsData.value.deviceTotal > 0 
    ? Number(((value / statsData.value.deviceTotal) * 100).toFixed(1))
    : 0

  echarts.init(el).setOption({
    series: [
      {
        type: 'gauge',
        startAngle: 360,
        endAngle: 0,
        min: 0,
        max: 100, // 将最大值设为100
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
          fontSize: 20,
          fontWeight: 'bold',
          fontFamily: 'Inter, sans-serif',
          color: color,
          offsetCenter: [0, '0'],
          formatter: (value: number) => {
            return `${value}%\n(${statsData.value.deviceTotal > 0 ? Math.round((value / 100) * statsData.value.deviceTotal) : 0}个)`
          },
          rich: {
            value: {
              fontSize: 20,
              fontWeight: 'bold',
              color: color,
              padding: [0, 0, 10, 0]
            },
            unit: {
              fontSize: 14,
              color: '#6B7280',
              padding: [0, 0, 0, 0]
            }
          }
        },
        data: [{ value: percentage }]
      }
    ]
  })
}

/** 初始化消息统计图表 */
const initMessageChart = () => {
  const xdata: string[] = []
  const upData: string[] = []
  const downData: string[] = []

  statsData.value.deviceUpMessageStats.forEach((msg) => {
    xdata.push(formatDate(msg.time, 'YYYY-MM-DD HH:mm'))
    upData.push(msg.data)
  })

  statsData.value.deviceDownMessageStats.forEach((msg) => {
    downData.push(msg.data)
  })

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
        stack: 'Total',
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
        stack: 'Total',
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
</style>
