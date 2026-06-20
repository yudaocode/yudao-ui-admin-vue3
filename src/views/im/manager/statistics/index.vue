<template>
  <div class="im-statistics">
    <!-- 页头 -->
    <div class="im-statistics__hero">
      <div class="im-statistics__hero-title">IM 数据看板</div>
      <div class="im-statistics__hero-desc">用户、群组与消息的整体运营概览</div>
    </div>

    <!-- 概览卡片 -->
    <OverviewCards :overview="overview" :loading="overviewLoading" />

    <!-- 趋势：消息 + 用户 -->
    <el-row :gutter="16">
      <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
        <MessageTrendChart />
      </el-col>
      <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
        <UserTrendChart />
      </el-col>
    </el-row>

    <!-- 分布：内容类型 + 群规模 + TOP 发送者 -->
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
const overviewLoading = ref(false)

onMounted(async () => {
  overviewLoading.value = true
  try {
    overview.value = await StatisticsApi.getStatisticsOverview()
  } finally {
    overviewLoading.value = false
  }
})
</script>

<style lang="scss" scoped>
.im-statistics {
  padding: 16px;

  &__hero {
    padding: 4px 2px;
    margin-bottom: 16px;
  }

  &__hero-title {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--el-text-color-primary);
  }

  &__hero-desc {
    margin-top: 6px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}
</style>
