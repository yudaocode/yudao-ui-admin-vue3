<template>
  <doc-alert title="ERP 手册（功能开启）" url="https://doc.iocoder.cn/erp/build/" />

  <div class="flex flex-col">
    <!-- 销售/采购的全局统计 -->
    <el-row :gutter="16" class="row">
      <el-col :md="6" :sm="12" :xs="24" :loading="loading">
        <SummaryCard title="今日销售" :value="saleSummary?.todayPrice" />
      </el-col>
      <el-col :md="6" :sm="12" :xs="24" :loading="loading">
        <SummaryCard title="昨日销售" :value="saleSummary?.yesterdayPrice" />
      </el-col>
      <el-col :md="6" :sm="12" :xs="24" :loading="loading">
        <SummaryCard title="今日采购" :value="purchaseSummary?.todayPrice" />
      </el-col>
      <el-col :md="6" :sm="12" :xs="24" :loading="loading">
        <SummaryCard title="昨日采购" :value="purchaseSummary?.yesterdayPrice" />
      </el-col>
      <el-col :md="6" :sm="12" :xs="24" :loading="loading">
        <SummaryCard title="本月销售" :value="saleSummary?.monthPrice" />
      </el-col>
      <el-col :md="6" :sm="12" :xs="24" :loading="loading">
        <SummaryCard title="今年销售" :value="saleSummary?.yearPrice" />
      </el-col>
      <el-col :md="6" :sm="12" :xs="24" :loading="loading">
        <SummaryCard title="本月采购" :value="purchaseSummary?.monthPrice" />
      </el-col>
      <el-col :md="6" :sm="12" :xs="24" :loading="loading">
        <SummaryCard title="今年采购" :value="purchaseSummary?.yearPrice" />
      </el-col>
    </el-row>
    <!-- 销售/采购的时段统计 -->
    <el-row :gutter="16" class="row">
      <!-- 销售统计 -->
      <el-col :md="12" :sm="12" :xs="24" :loading="loading">
        <TimeSummaryChart title="销售统计" :value="saleTimeSummaryList" />
      </el-col>
      <!-- 采购统计 -->
      <el-col :md="12" :sm="12" :xs="24" :loading="loading">
        <TimeSummaryChart title="采购统计" :value="purchaseTimeSummaryList" />
      </el-col>
    </el-row>
  </div>
</template>
<script lang="ts" setup>
import SummaryCard from './components/SummaryCard.vue'
import TimeSummaryChart from './components/TimeSummaryChart.vue'
import {
  ErpSaleSummaryRespVO,
  ErpSaleTimeSummaryRespVO,
  SaleStatisticsApi
} from '@/api/erp/statistics/sale'
import {
  ErpPurchaseSummaryRespVO,
  ErpPurchaseTimeSummaryRespVO,
  PurchaseStatisticsApi
} from '@/api/erp/statistics/purchase'

/** 商城首页 */
defineOptions({ name: 'ErpHome' })

const loading = ref(true) // 加载中

/** 获得销售统计 */
const saleSummary = ref<ErpSaleSummaryRespVO>() // 销售概况统计
const saleTimeSummaryList = ref<ErpSaleTimeSummaryRespVO[]>() // 销售时段统计
const getSaleSummary = async () => {
  saleSummary.value = await SaleStatisticsApi.getSaleSummary()
  saleTimeSummaryList.value = await SaleStatisticsApi.getSaleTimeSummary()
}

/** 获得采购统计 */
const purchaseSummary = ref<ErpPurchaseSummaryRespVO>() // 采购概况统计
const purchaseTimeSummaryList = ref<ErpPurchaseTimeSummaryRespVO[]>() // 采购时段统计
const getPurchaseSummary = async () => {
  purchaseSummary.value = await PurchaseStatisticsApi.getPurchaseSummary()
  purchaseTimeSummaryList.value = await PurchaseStatisticsApi.getPurchaseTimeSummary()
}

/** 初始化 **/
onMounted(async () => {
  loading.value = true
  await Promise.all([getSaleSummary(), getPurchaseSummary()])
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
