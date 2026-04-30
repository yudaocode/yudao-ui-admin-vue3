<template>
  <div class="dashboard">
    <!-- KPI 卡片 -->
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
    <el-row v-if="distribution" :gutter="16">
      <el-col :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
        <MessageTypeChart :data="distribution.messageTypeDistribution" />
      </el-col>
      <el-col :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
        <GroupSizeChart :data="distribution.groupSizeDistribution" />
      </el-col>
      <el-col :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
        <TopSendersChart :data="distribution.topSenders" />
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

const overview = ref<StatisticsApi.ImStatisticsOverviewVO>()
const distribution = ref<StatisticsApi.ImStatisticsDistributionVO>()

onMounted(async () => {
  // 父页只拉 KPI + 分布；趋势组件自己内部拉，避免父组件维护 days 状态
  const [o, d] = await Promise.all([
    StatisticsApi.getStatisticsOverview(),
    StatisticsApi.getStatisticsDistribution()
  ])
  overview.value = o
  distribution.value = d
})
</script>

<style scoped>
.dashboard {
  padding: 16px;
}
</style>
