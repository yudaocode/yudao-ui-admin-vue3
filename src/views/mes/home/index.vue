<template>
  <div>
    <!-- TODO @AI：row 之间的间距太大了； -->
    <!-- Row 1: 核心 KPI 汇总卡片 -->
    <HomeKpiCards :summary="summary" @navigate="handleNavigate" />

    <!-- Row 2: 生产趋势 + 待办异常 -->
    <el-row :gutter="16" class="mb-16px">
      <!-- 生产趋势图 -->
      <el-col :xl="16" :lg="16" :md="24" :sm="24" :xs="24" class="mb-16px">
        <HomeProductionTrend ref="productionTrendRef" />
      </el-col>
      <!-- 待办事项 / 异常提醒 -->
      <el-col :xl="8" :lg="8" :md="24" :sm="24" :xs="24" class="mb-16px">
        <HomeAlertPanel :summary="summary" @navigate="handleNavigate" />
      </el-col>
    </el-row>

    <!-- Row 3: 工单分布 + 快捷入口 -->
    <el-row :gutter="16">
      <!-- 工单状态分布 -->
      <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24" class="mb-16px">
        <HomeWorkOrderChart ref="workOrderChartRef" />
      </el-col>
      <!-- 快捷入口 -->
      <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24" class="mb-16px">
        <HomeShortcuts @navigate="handleNavigate" />
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { MesHomeStatisticsApi, MesHomeSummaryVO } from '@/api/mes/home'
import HomeKpiCards from './HomeKpiCards.vue'
import HomeAlertPanel from './HomeAlertPanel.vue'
import HomeProductionTrend from './HomeProductionTrend.vue'
import HomeWorkOrderChart from './HomeWorkOrderChart.vue'
import HomeShortcuts from './HomeShortcuts.vue'

defineOptions({ name: 'MesHome' })

const router = useRouter()

const summary = ref<MesHomeSummaryVO>({
  workOrderActiveCount: 0,
  workOrderPrepareCount: 0,
  workOrderFinishedCount: 0,
  todayOutput: 0,
  yesterdayOutput: 0,
  todayQualifiedQuantity: 0,
  todayUnqualifiedQuantity: 0,
  machineryTotal: 0,
  machineryProducing: 0,
  machineryStop: 0,
  machineryMaintenance: 0,
  andonActiveCount: 0,
  repairActiveCount: 0
}) // 数据
const productionTrendRef = ref<InstanceType<typeof HomeProductionTrend>>()
const workOrderChartRef = ref<InstanceType<typeof HomeWorkOrderChart>>()

// TODO @AI：可以改成 name 么？因为 url 可能会变，而 name 更稳定！
const handleNavigate = (url: string) => {
  router.push(url)
}

onMounted(async () => {
  const [summaryData] = await Promise.all([
    MesHomeStatisticsApi.getHomeSummary(),
    // TODO @AI：productionTrendRef、workOrderChartRef 可以自己加载自己的数据，自己使用么？
    productionTrendRef.value?.loadData(),
    workOrderChartRef.value?.loadData()
  ])
  summary.value = summaryData
})
</script>
