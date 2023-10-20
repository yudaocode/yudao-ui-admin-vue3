<template>
  <div class="flex flex-col">
    <el-row :gutter="16" class="summary">
      <el-col :sm="6" :xs="12">
        <TradeStatisticValue
          tooltip="昨日订单数量"
          title="昨日订单数量"
          :value="summary?.value?.yesterdayOrderCount || 0"
          :percent="
            calculateRelativeRate(
              summary?.value?.yesterdayOrderCount,
              summary?.reference?.yesterdayOrderCount
            )
          "
        />
      </el-col>
      <el-col :sm="6" :xs="12">
        <TradeStatisticValue
          tooltip="本月订单数量"
          title="本月订单数量"
          :value="summary?.value?.monthOrderCount || 0"
          :percent="
            calculateRelativeRate(
              summary?.value?.monthOrderCount,
              summary?.reference?.monthOrderCount
            )
          "
        />
      </el-col>
      <el-col :sm="6" :xs="12">
        <TradeStatisticValue
          tooltip="昨日支付金额"
          title="昨日支付金额"
          prefix="￥"
          :decimals="2"
          :value="fenToYuan(summary?.value?.yesterdayPayPrice || 0)"
          :percent="
            calculateRelativeRate(
              summary?.value?.yesterdayPayPrice,
              summary?.reference?.yesterdayPayPrice
            )
          "
        />
      </el-col>
      <el-col :sm="6" :xs="12">
        <TradeStatisticValue
          tooltip="本月支付金额"
          title="本月支付金额"
          prefix="￥"
          ::decimals="2"
          :value="fenToYuan(summary?.value?.monthPayPrice || 0)"
          :percent="
            calculateRelativeRate(summary?.value?.monthPayPrice, summary?.reference?.monthPayPrice)
          "
        />
      </el-col>
    </el-row>
    <el-card shadow="never">
      <template #header>
        <!-- 标题 -->
        <div class="flex flex-row items-center justify-between">
          <CardTitle title="交易状况" />
          <!-- 查询条件 -->
          <ShortcutDateRangePicker ref="shortcutDateRangePicker" @change="getTradeTrendData">
            <el-button
              class="ml-4"
              @click="handleExport"
              :loading="exportLoading"
              v-hasPermi="['statistics:trade:export']"
            >
              <Icon icon="ep:download" class="mr-1" />导出
            </el-button>
          </ShortcutDateRangePicker>
        </div>
      </template>
      <!-- 统计值 -->
      <el-row :gutter="16">
        <el-col :md="6" :sm="12" :xs="24">
          <SummaryCard
            title="营业额"
            tooltip="商品支付金额、充值金额"
            icon="fa-solid:yen-sign"
            icon-color="bg-blue-100"
            icon-bg-color="text-blue-500"
            prefix="￥"
            :decimals="2"
            :value="fenToYuan(trendSummary?.value?.turnoverPrice || 0)"
            :percent="
              calculateRelativeRate(
                trendSummary?.value?.turnoverPrice,
                trendSummary?.reference?.turnoverPrice
              )
            "
          />
        </el-col>
        <el-col :md="6" :sm="12" :xs="24">
          <SummaryCard
            title="商品支付金额"
            tooltip="用户购买商品的实际支付金额，包括微信支付、余额支付、支付宝支付、线下支付金额（拼团商品在成团之后计入，线下支付订单在后台确认支付后计入）"
            icon="fa-solid:shopping-cart"
            icon-color="bg-purple-100"
            icon-bg-color="text-purple-500"
            prefix="￥"
            :decimals="2"
            :value="fenToYuan(trendSummary?.value?.orderPayPrice || 0)"
            :percent="
              calculateRelativeRate(
                trendSummary?.value?.orderPayPrice,
                trendSummary?.reference?.orderPayPrice
              )
            "
          />
        </el-col>
        <el-col :md="6" :sm="12" :xs="24">
          <SummaryCard
            title="充值金额"
            tooltip="用户成功充值的金额"
            icon="fa-solid:money-check-alt"
            icon-color="bg-yellow-100"
            icon-bg-color="text-yellow-500"
            prefix="￥"
            :decimals="2"
            :value="fenToYuan(trendSummary?.value?.rechargePrice || 0)"
            :percent="
              calculateRelativeRate(
                trendSummary?.value?.rechargePrice,
                trendSummary?.reference?.rechargePrice
              )
            "
          />
        </el-col>
        <el-col :md="6" :sm="12" :xs="24">
          <SummaryCard
            title="支出金额"
            tooltip="余额支付金额、支付佣金金额、商品退款金额"
            icon="ep:warning-filled"
            icon-color="bg-green-100"
            icon-bg-color="text-green-500"
            prefix="￥"
            :decimals="2"
            :value="fenToYuan(trendSummary?.value?.expensePrice || 0)"
            :percent="
              calculateRelativeRate(
                trendSummary?.value?.expensePrice,
                trendSummary?.reference?.expensePrice
              )
            "
          />
        </el-col>
        <el-col :md="6" :sm="12" :xs="24">
          <SummaryCard
            title="余额支付金额"
            tooltip="用户下单时使用余额实际支付的金额"
            icon="fa-solid:wallet"
            icon-color="bg-cyan-100"
            icon-bg-color="text-cyan-500"
            prefix="￥"
            :decimals="2"
            :value="fenToYuan(trendSummary?.value?.walletPayPrice || 0)"
            :percent="
              calculateRelativeRate(
                trendSummary?.value?.walletPayPrice,
                trendSummary?.reference?.walletPayPrice
              )
            "
          />
        </el-col>
        <el-col :md="6" :sm="12" :xs="24">
          <SummaryCard
            title="支付佣金金额"
            tooltip="后台给推广员支付的推广佣金，以实际支付为准"
            icon="fa-solid:award"
            icon-color="bg-yellow-100"
            icon-bg-color="text-yellow-500"
            prefix="￥"
            :decimals="2"
            :value="fenToYuan(trendSummary?.value?.brokerageSettlementPrice || 0)"
            :percent="
              calculateRelativeRate(
                trendSummary?.value?.brokerageSettlementPrice,
                trendSummary?.reference?.brokerageSettlementPrice
              )
            "
          />
        </el-col>
        <el-col :md="6" :sm="12" :xs="24">
          <SummaryCard
            title="商品退款金额"
            tooltip="用户成功退款的商品金额"
            icon="fa-solid:times-circle"
            icon-color="bg-blue-100"
            icon-bg-color="text-blue-500"
            prefix="￥"
            :decimals="2"
            :value="fenToYuan(trendSummary?.value?.afterSaleRefundPrice || 0)"
            :percent="
              calculateRelativeRate(
                trendSummary?.value?.afterSaleRefundPrice,
                trendSummary?.reference?.afterSaleRefundPrice
              )
            "
          />
        </el-col>
      </el-row>
      <!-- 折线图 -->
      <el-skeleton :loading="trendLoading" animated>
        <Echart :height="500" :options="lineChartOptions" />
      </el-skeleton>
    </el-card>
  </div>
</template>
<script lang="ts" setup>
import * as TradeStatisticsApi from '@/api/mall/statistics/trade'
import TradeStatisticValue from './components/TradeStatisticValue.vue'
import SummaryCard from '@/components/SummaryCard/index.vue'
import { EChartsOption } from 'echarts'
import { DataComparisonRespVO } from '@/api/mall/statistics/common'
import { TradeSummaryRespVO, TradeTrendSummaryRespVO } from '@/api/mall/statistics/trade'
import { calculateRelativeRate, fenToYuan } from '@/utils'
import download from '@/utils/download'
import { CardTitle } from '@/components/Card'

/** 交易统计 */
defineOptions({ name: 'TradeStatistics' })

const message = useMessage() // 消息弹窗

const trendLoading = ref(true) // 交易状态加载中
const exportLoading = ref(false) // 导出的加载中
const summary = ref<DataComparisonRespVO<TradeSummaryRespVO>>() // 交易统计数据
const trendSummary = ref<DataComparisonRespVO<TradeTrendSummaryRespVO>>() // 交易状况统计数据
const shortcutDateRangePicker = ref()

/** 折线图配置 */
const lineChartOptions = reactive<EChartsOption>({
  dataset: {
    dimensions: ['date', 'turnoverPrice', 'orderPayPrice', 'rechargePrice', 'expensePrice'],
    source: []
  },
  grid: {
    left: 20,
    right: 20,
    bottom: 20,
    top: 80,
    containLabel: true
  },
  legend: {
    top: 50
  },
  series: [
    { name: '营业额', type: 'line', smooth: true },
    { name: '商品支付金额', type: 'line', smooth: true },
    { name: '充值金额', type: 'line', smooth: true },
    { name: '支出金额', type: 'line', smooth: true }
  ],
  toolbox: {
    feature: {
      // 数据区域缩放
      dataZoom: {
        yAxisIndex: false // Y轴不缩放
      },
      brush: {
        type: ['lineX', 'clear'] // 区域缩放按钮、还原按钮
      },
      saveAsImage: { show: true, name: '交易状况' } // 保存为图片
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross'
    },
    padding: [5, 10]
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    axisTick: {
      show: false
    }
  },
  yAxis: {
    axisTick: {
      show: false
    }
  }
}) as EChartsOption

/** 处理交易状况查询 */
const getTradeTrendData = async () => {
  trendLoading.value = true
  await Promise.all([getTradeTrendSummary(), getTradeStatisticsList()])
  trendLoading.value = false
}

/** 查询交易统计 */
const getTradeStatisticsSummary = async () => {
  summary.value = await TradeStatisticsApi.getTradeStatisticsSummary()
}

/** 查询交易状况数据统计 */
const getTradeTrendSummary = async () => {
  const times = shortcutDateRangePicker.value.times
  trendSummary.value = await TradeStatisticsApi.getTradeTrendSummary({ times })
}

/** 查询交易状况数据列表 */
const getTradeStatisticsList = async () => {
  // 查询数据
  const times = shortcutDateRangePicker.value.times
  const list = await TradeStatisticsApi.getTradeStatisticsList({ times })
  // 处理数据
  for (let item of list) {
    item.turnoverPrice = fenToYuan(item.turnoverPrice)
    item.orderPayPrice = fenToYuan(item.orderPayPrice)
    item.rechargePrice = fenToYuan(item.rechargePrice)
    item.expensePrice = fenToYuan(item.expensePrice)
  }
  // 更新 Echarts 数据
  if (lineChartOptions.dataset && lineChartOptions.dataset['source']) {
    lineChartOptions.dataset['source'] = list
  }
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const times = shortcutDateRangePicker.value.times
    const data = await TradeStatisticsApi.exportTradeStatisticsExcel({ times })
    download.excel(data, '交易状况.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(async () => {
  await getTradeStatisticsSummary()
})
</script>
<style lang="scss" scoped>
.summary {
  .el-col {
    margin-bottom: 1rem;
  }
}
</style>
