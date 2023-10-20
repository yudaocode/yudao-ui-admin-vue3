<template>
  <div class="flex flex-col">
    <!-- 数据对照 -->
    <el-row :gutter="16" class="row">
      <el-col :md="6" :sm="12" :xs="24" :loading="loading">
        <ComparisonCard
          tag="今日"
          title="销售额"
          prefix="￥"
          ::decimals="2"
          :value="fenToYuan(orderComparison?.value?.orderPayPrice || 0)"
          :reference="fenToYuan(orderComparison?.reference?.orderPayPrice || 0)"
        />
      </el-col>
      <el-col :md="6" :sm="12" :xs="24" :loading="loading">
        <ComparisonCard
          tag="今日"
          title="用户访问量"
          :value="userComparison?.value?.visitUserCount || 0"
          :reference="userComparison?.reference?.visitUserCount || 0"
        />
      </el-col>
      <el-col :md="6" :sm="12" :xs="24" :loading="loading">
        <ComparisonCard
          tag="今日"
          title="订单量"
          :value="fenToYuan(orderComparison?.value?.orderPayCount || 0)"
          :reference="fenToYuan(orderComparison?.reference?.orderPayCount || 0)"
        />
      </el-col>
      <el-col :md="6" :sm="12" :xs="24" :loading="loading">
        <ComparisonCard
          tag="今日"
          title="新增用户"
          :value="userComparison?.value?.registerUserCount || 0"
          :reference="userComparison?.reference?.registerUserCount || 0"
        />
      </el-col>
    </el-row>
    <el-row :gutter="16" class="row">
      <el-col :md="12">
        <!-- 快捷入口 -->
        <ShortcutCard />
      </el-col>
      <el-col :md="12">
        <!-- 运营数据 -->
        <OperationDataCard />
      </el-col>
    </el-row>
    <el-row :gutter="16" class="mb-4">
      <el-col :md="18" :sm="24">
        <!-- 会员概览 -->
        <MemberFunnelCard />
      </el-col>
      <el-col :md="6" :sm="24">
        <!-- 会员终端 -->
        <MemberTerminalCard />
      </el-col>
    </el-row>
    <!-- 交易量趋势 -->
    <TradeTrendCard class="mb-4" />
    <!-- 会员统计 -->
    <MemberStatisticsCard />
  </div>
</template>
<script lang="ts" setup>
import * as TradeStatisticsApi from '@/api/mall/statistics/trade'
import * as MemberStatisticsApi from '@/api/mall/statistics/member'
import { DataComparisonRespVO } from '@/api/mall/statistics/common'
import { TradeOrderSummaryRespVO } from '@/api/mall/statistics/trade'
import { MemberCountRespVO } from '@/api/mall/statistics/member'
import { fenToYuan } from '@/utils'
import ComparisonCard from './components/ComparisonCard.vue'
import MemberStatisticsCard from './components/MemberStatisticsCard.vue'
import OperationDataCard from './components/OperationDataCard.vue'
import ShortcutCard from './components/ShortcutCard.vue'
import TradeTrendCard from './components/TradeTrendCard.vue'
import MemberTerminalCard from '@/views/mall/statistics/member/components/MemberTerminalCard.vue'
import MemberFunnelCard from '@/views/mall/statistics/member/components/MemberFunnelCard.vue'

/** 商城首页 */
defineOptions({ name: 'MallHome' })

const loading = ref(true) // 加载中
const orderComparison = ref<DataComparisonRespVO<TradeOrderSummaryRespVO>>() // 交易对照数据
const userComparison = ref<DataComparisonRespVO<MemberCountRespVO>>() // 用户对照数据

/** 查询交易对照卡片数据 */
const getOrderComparison = async () => {
  orderComparison.value = await TradeStatisticsApi.getOrderComparison()
}

/** 查询会员用户数量对照卡片数据 */
const getUserCountComparison = async () => {
  userComparison.value = await MemberStatisticsApi.getUserCountComparison()
}

/** 初始化 **/
onMounted(async () => {
  loading.value = true
  await Promise.all([getOrderComparison(), getUserCountComparison()])
  loading.value = false
})
</script>
<style lang="scss" scoped>
.row {
  .el-col {
    margin-bottom: 1rem;
  }
}
</style>
