<template>
  <div
    v-loading="loading"
    class="border border-[var(--el-border-color-light)] border-solid rounded-8px bg-[var(--el-bg-color)] p-18px"
  >
    <div class="mb-12px">
      <div class="text-16px font-600 text-[var(--el-text-color-primary)]">Agent 消息占比</div>
      <div class="text-13px text-[var(--el-text-color-secondary)]">
        近 {{ days }} 天各 Agent 会话消息数量
      </div>
    </div>
    <el-empty v-if="isEmpty(list)" description="暂无数据" :image-size="80" class="!h-320px" />
    <Echart v-else :height="320" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { isEmpty } from '@/utils/is'
import { HomeApi, HomeMessageSummaryByAgent } from '@/api/ai1/home'

/** AI1 首页 Agent 消息占比 */
defineOptions({ name: 'Ai1HomeMessageAgentChart' })

const loading = ref(false) // 加载中
const days = ref<number>() // 统计天数
const list = ref<HomeMessageSummaryByAgent[]>([]) // 按 Agent 消息统计

/** 饼图配置 */
const chartOptions = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { type: 'scroll', bottom: 0 },
  series: [
    {
      name: '消息数量',
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      data: list.value.map((item) => ({
        name: item.agentName || `Agent#${item.agentId}`, // Agent 已删除时展示编号
        value: item.count
      }))
    }
  ]
}))

/** 加载按 Agent 消息统计 */
const load = async (value: number) => {
  days.value = value
  loading.value = true
  try {
    list.value = await HomeApi.getMessageSummaryByAgent(value)
  } finally {
    loading.value = false
  }
}
defineExpose({ load }) // 提供 load 方法，用于首页刷新
</script>
