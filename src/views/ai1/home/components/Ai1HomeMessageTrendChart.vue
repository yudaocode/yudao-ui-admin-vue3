<template>
  <div
    v-loading="loading"
    class="border border-[var(--el-border-color-light)] border-solid rounded-8px bg-[var(--el-bg-color)] p-18px"
  >
    <div class="mb-12px">
      <div class="text-16px font-600 text-[var(--el-text-color-primary)]">消息趋势</div>
      <div class="text-13px text-[var(--el-text-color-secondary)]">
        近 {{ days }} 天每日会话消息数量
      </div>
    </div>
    <Echart :height="320" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { HomeApi, HomeMessageSummaryByDate } from '@/api/ai1/home'

/** AI1 首页消息趋势 */
defineOptions({ name: 'Ai1HomeMessageTrendChart' })

const loading = ref(false) // 加载中
const days = ref<number>() // 统计天数
const list = ref<HomeMessageSummaryByDate[]>([]) // 每日消息统计

/** 折线图配置 */
const chartOptions = computed<EChartsOption>(() => ({
  grid: { left: 20, right: 20, top: 20, bottom: 20, containLabel: true },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: list.value.map((item) => item.date) },
  yAxis: { type: 'value', minInterval: 1 },
  series: [
    {
      name: '消息数量',
      type: 'line',
      smooth: true,
      areaStyle: {},
      data: list.value.map((item) => item.count)
    }
  ]
}))

/** 加载按日消息统计 */
const load = async (value: number) => {
  days.value = value
  loading.value = true
  try {
    list.value = await HomeApi.getMessageSummaryByDate(value)
  } finally {
    loading.value = false
  }
}
defineExpose({ load }) // 提供 load 方法，用于首页刷新
</script>
