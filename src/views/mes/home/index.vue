<template>
  <doc-alert title="MES 手册（功能开启）" url="https://doc.iocoder.cn/mes/build/" />

  <div>
    <!-- Row 1: 核心 KPI 汇总卡片 -->
    <HomeKpiCards :summary="summary" @navigate="handleNavigate" />

    <!-- Row 2: 生产趋势 + 待办异常 -->
    <el-row :gutter="16" class="mb-16px">
      <!-- 生产趋势图 -->
      <el-col :xl="16" :lg="16" :md="24" :sm="24" :xs="24" class="mb-16px">
        <HomeProductionTrend />
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
        <HomeWorkOrderChart />
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

const handleNavigate = (name: string) => {
  router.push({ name })
}

onMounted(async () => {
  summary.value = await MesHomeStatisticsApi.getHomeSummary()
})
</script>
