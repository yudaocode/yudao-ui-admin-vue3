<template>
  <div class="dashboard">
    <!-- 概览卡片 -->
    <OverviewCards v-if="overview" :overview="overview" />

    <!-- 趋势 -->
    <el-row :gutter="16">
      <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
        <MessageTrendChart />
      </el-col>
      <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
        <UserTrendChart />
      </el-col>
    </el-row>

    <!-- 分布 -->
    <el-row :gutter="16">
      <el-col :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
        <MessageTypeChart />
      </el-col>
      <el-col :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
        <GroupSizeChart />
      </el-col>
      <el-col :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
        <TopSendersChart />
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import * as StatisticsApi from '@/api/im/manager/statistics'
import OverviewCards from './components/OverviewCards.vue'
import MessageTrendChart from './components/MessageTrendChart.vue'
import UserTrendChart from './components/UserTrendChart.vue'
import MessageTypeChart from './components/MessageTypeChart.vue'
import GroupSizeChart from './components/GroupSizeChart.vue'
import TopSendersChart from './components/TopSendersChart.vue'

defineOptions({ name: 'ImStatistics' })

// 父页只拉概览数据；趋势 / 分布组件各自独立拉取，互不阻塞
const overview = ref<StatisticsApi.ImStatisticsOverviewVO>()

onMounted(async () => {
  overview.value = await StatisticsApi.getStatisticsOverview()
})
</script>

<style scoped>
.dashboard {
  padding: 16px;
}
</style>
