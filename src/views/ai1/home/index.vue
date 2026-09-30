<template>
  <!-- 头部 -->
  <div
    class="mb-16px flex flex-wrap items-center justify-between gap-16px border border-[var(--el-border-color-light)] border-solid rounded-8px bg-[var(--el-bg-color)] p-16px"
  >
    <div>
      <div class="text-20px font-600 leading-28px text-[var(--el-text-color-primary)]">
        AI1 首页
      </div>
      <div class="text-13px text-[var(--el-text-color-secondary)]">资源总览 / 会话消息统计</div>
    </div>
    <div class="flex flex-wrap items-center gap-8px">
      <el-radio-group v-model="days" @change="loadCharts">
        <el-radio-button :value="7">近 7 天</el-radio-button>
        <el-radio-button :value="14">近 14 天</el-radio-button>
        <el-radio-button :value="30">近 30 天</el-radio-button>
      </el-radio-group>
      <el-button :loading="loading" @click="refresh">
        <Icon icon="ep:refresh" class="mr-5px" /> 刷新
      </el-button>
    </div>
  </div>

  <!-- 第一行：总量统计 -->
  <Ai1HomeSummaryCards ref="summaryCardsRef" />

  <!-- 第二行：消息趋势 + Agent 消息占比 -->
  <div class="grid grid-cols-3 gap-16px lt-lg:grid-cols-1">
    <Ai1HomeMessageTrendChart ref="trendChartRef" class="col-span-2 lt-lg:col-span-1" />
    <Ai1HomeMessageAgentChart ref="agentChartRef" />
  </div>
</template>

<script setup lang="ts">
import Ai1HomeSummaryCards from './components/Ai1HomeSummaryCards.vue'
import Ai1HomeMessageTrendChart from './components/Ai1HomeMessageTrendChart.vue'
import Ai1HomeMessageAgentChart from './components/Ai1HomeMessageAgentChart.vue'

/** AI1 首页 */
defineOptions({ name: 'Ai1Home' })

const loading = ref(false) // 刷新中
const days = ref(30) // 统计天数
const summaryCardsRef = ref<InstanceType<typeof Ai1HomeSummaryCards>>() // 总量统计卡片 Ref
const trendChartRef = ref<InstanceType<typeof Ai1HomeMessageTrendChart>>() // 消息趋势 Ref
const agentChartRef = ref<InstanceType<typeof Ai1HomeMessageAgentChart>>() // Agent 消息占比 Ref

/** 加载图表 */
const loadCharts = async () => {
  await Promise.all([trendChartRef.value?.load(days.value), agentChartRef.value?.load(days.value)])
}

/** 刷新 */
const refresh = async () => {
  loading.value = true
  try {
    await Promise.all([summaryCardsRef.value?.load(), loadCharts()])
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  refresh()
})
</script>
