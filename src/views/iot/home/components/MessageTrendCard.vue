<template>
  <el-card class="chart-card" shadow="never" :loading="loading">
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-base font-medium text-gray-600">消息量统计</span>
        <div class="flex flex-wrap items-center gap-4">
          <el-form-item label="时间范围" class="!mb-0">
            <el-date-picker
              v-model="queryParams.times"
              :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
              :shortcuts="defaultShortcuts"
              class="!w-240px"
              end-placeholder="结束日期"
              start-placeholder="开始日期"
              type="daterange"
              value-format="YYYY-MM-DD HH:mm:ss"
              @change="handleQuery"
            />
          </el-form-item>
          <el-form-item label="时间间隔" class="!mb-0">
            <el-select
              v-model="queryParams.interval"
              class="!w-120px"
              placeholder="间隔类型"
              @change="handleQuery"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.DATE_INTERVAL)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </div>
      </div>
    </template>
    <div v-if="loading && !hasData" class="h-[300px] flex justify-center items-center">
      <el-empty description="加载中..." />
    </div>
    <div v-else-if="!hasData" class="h-[300px] flex justify-center items-center">
      <el-empty description="暂无数据" />
    </div>
    <div v-else ref="messageChartRef" class="h-[300px]"></div>
  </el-card>
</template>

<script lang="ts" setup>
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { UniversalTransition } from 'echarts/features'
import {
  StatisticsApi,
  IotStatisticsDeviceMessageSummaryByDateRespVO,
  IotStatisticsDeviceMessageReqVO
} from '@/api/iot/statistics'
import { formatDate, beginOfDay, endOfDay, defaultShortcuts } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

/** 消息趋势统计卡片 */
defineOptions({ name: 'MessageTrendCard' })

const messageChartRef = ref()
const loading = ref(false)
const messageData = ref<IotStatisticsDeviceMessageSummaryByDateRespVO[]>([])

const queryParams = reactive<IotStatisticsDeviceMessageReqVO>({
  interval: 1, // DAY, 日
  times: [
    // 默认显示最近一周的数据
    formatDate(beginOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24 * 7))),
    formatDate(endOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24)))
  ]
}) // 查询参数

// 是否有数据
const hasData = computed(() => {
  return messageData.value && messageData.value.length > 0
})

// 处理查询操作
const handleQuery = () => {
  fetchMessageData()
}

// 获取消息统计数据
const fetchMessageData = async () => {
  loading.value = true
  try {
    messageData.value = await StatisticsApi.getDeviceMessageSummaryByDate(queryParams)

    // 使用 nextTick 确保数据更新后重新渲染图表
    await nextTick()
    initChart()
  } catch (error) {
    console.error('获取消息统计数据失败:', error)
    messageData.value = []
  } finally {
    loading.value = false
  }
}

// 初始化图表
const initChart = () => {
  // 检查是否有数据可以绘制
  if (!hasData.value) return
  // 确保 DOM 元素存在且已渲染
  if (!messageChartRef.value) {
    console.warn('图表 DOM 元素不存在')
    return
  }

  // 配置图表
  echarts.use([
    LineChart,
    CanvasRenderer,
    GridComponent,
    LegendComponent,
    TooltipComponent,
    UniversalTransition
  ])
  try {
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
        data: messageData.value.map((item) => item.time),
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
          data: messageData.value.map((item) => item.upstreamCount),
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
          data: messageData.value.map((item) => item.downstreamCount),
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
    return chart
  } catch (error) {
    console.error('初始化图表失败:', error)
    return null
  }
}

/** 组件挂载时初始化 */
onMounted(() => {
  fetchMessageData()
})
</script>
