<template>
  <el-card shadow="never">
    <template #header>
      <!-- 标题 -->
      <div class="flex flex-row items-center justify-between">
        <CardTitle title="商品概况" />
        <!-- 查询条件 -->
        <ShortcutDateRangePicker ref="shortcutDateRangePicker" @change="getProductTrendData">
          <el-button
            class="ml-4"
            @click="handleExport"
            :loading="exportLoading"
            v-hasPermi="['statistics:product:export']"
          >
            <Icon icon="ep:download" class="mr-1" />导出
          </el-button>
        </ShortcutDateRangePicker>
      </div>
    </template>
    <!-- 统计值 -->
    <el-row :gutter="16">
      <el-col :xl="4" :md="8" :sm="24">
        <SummaryCard
          title="商品浏览量"
          tooltip="在选定条件下，所有商品详情页被访问的次数，一个人在统计时间内访问多次记为多次"
          icon="ep:view"
          icon-color="bg-blue-100"
          icon-bg-color="text-blue-500"
          prefix="￥"
          :decimals="2"
          :value="fenToYuan(trendSummary?.value?.browseCount || 0)"
          :percent="
            calculateRelativeRate(
              trendSummary?.value?.browseCount,
              trendSummary?.reference?.browseCount
            )
          "
        />
      </el-col>
      <el-col :xl="4" :md="8" :sm="24">
        <SummaryCard
          title="商品访客数"
          tooltip="在选定条件下，访问任何商品详情页的人数，一个人在统计时间范围内访问多次只记为一个"
          icon="ep:user-filled"
          icon-color="bg-purple-100"
          icon-bg-color="text-purple-500"
          prefix="￥"
          :decimals="2"
          :value="fenToYuan(trendSummary?.value?.browseUserCount || 0)"
          :percent="
            calculateRelativeRate(
              trendSummary?.value?.browseUserCount,
              trendSummary?.reference?.browseUserCount
            )
          "
        />
      </el-col>
      <el-col :xl="4" :md="8" :sm="24">
        <SummaryCard
          title="支付件数"
          tooltip="在选定条件下，成功付款订单的商品件数之和"
          icon="fa-solid:money-check-alt"
          icon-color="bg-yellow-100"
          icon-bg-color="text-yellow-500"
          prefix="￥"
          :decimals="2"
          :value="fenToYuan(trendSummary?.value?.orderPayCount || 0)"
          :percent="
            calculateRelativeRate(
              trendSummary?.value?.orderPayCount,
              trendSummary?.reference?.orderPayCount
            )
          "
        />
      </el-col>
      <el-col :xl="4" :md="8" :sm="24">
        <SummaryCard
          title="支付金额"
          tooltip="在选定条件下，成功付款订单的商品金额之和"
          icon="ep:warning-filled"
          icon-color="bg-green-100"
          icon-bg-color="text-green-500"
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
      <el-col :xl="4" :md="8" :sm="24">
        <SummaryCard
          title="退款件数"
          tooltip="在选定条件下，成功退款的商品件数之和"
          icon="fa-solid:wallet"
          icon-color="bg-cyan-100"
          icon-bg-color="text-cyan-500"
          prefix="￥"
          :decimals="2"
          :value="fenToYuan(trendSummary?.value?.afterSaleCount || 0)"
          :percent="
            calculateRelativeRate(
              trendSummary?.value?.afterSaleCount,
              trendSummary?.reference?.afterSaleCount
            )
          "
        />
      </el-col>
      <el-col :xl="4" :md="8" :sm="24">
        <SummaryCard
          title="退款金额"
          tooltip="在选定条件下，成功退款的商品金额之和"
          icon="fa-solid:award"
          icon-color="bg-yellow-100"
          icon-bg-color="text-yellow-500"
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
</template>
<script lang="ts" setup>
import { ProductStatisticsApi, ProductStatisticsVO } from '@/api/mall/statistics/product'
import SummaryCard from '@/components/SummaryCard/index.vue'
import { EChartsOption } from 'echarts'
import { DataComparisonRespVO } from '@/api/mall/statistics/common'
import { calculateRelativeRate, fenToYuan } from '@/utils'
import download from '@/utils/download'
import { CardTitle } from '@/components/Card'
import * as DateUtil from '@/utils/formatTime'
import dayjs from 'dayjs'

/** 商品概况 */
defineOptions({ name: 'ProductSummary' })

const message = useMessage() // 消息弹窗

const trendLoading = ref(true) // 商品状态加载中
const exportLoading = ref(false) // 导出的加载中
const trendSummary = ref<DataComparisonRespVO<ProductStatisticsVO>>() // 商品状况统计数据
const shortcutDateRangePicker = ref()

/** 折线图配置 */
const lineChartOptions = reactive<EChartsOption>({
  dataset: {
    dimensions: ['time', 'browseCount', 'browseUserCount', 'orderPayPrice', 'afterSaleRefundPrice'],
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
    { name: '商品浏览量', type: 'line', smooth: true, itemStyle: { color: '#B37FEB' } },
    { name: '商品访客数', type: 'line', smooth: true, itemStyle: { color: '#FFAB2B' } },
    { name: '支付金额', type: 'bar', smooth: true, yAxisIndex: 1, itemStyle: { color: '#1890FF' } },
    { name: '退款金额', type: 'bar', smooth: true, yAxisIndex: 1, itemStyle: { color: '#00C050' } }
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
      saveAsImage: { show: true, name: '商品状况' } // 保存为图片
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
    boundaryGap: true,
    axisTick: {
      show: false
    }
  },
  yAxis: [
    {
      type: 'value',
      name: '金额',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        textStyle: {
          color: '#7F8B9C'
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#F5F7F9'
        }
      }
    },
    {
      type: 'value',
      name: '数量',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        textStyle: {
          color: '#7F8B9C'
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#F5F7F9'
        }
      }
    }
  ]
}) as EChartsOption

/** 处理商品状况查询 */
const getProductTrendData = async () => {
  trendLoading.value = true
  // 1. 处理时间: 开始与截止在同一天的, 折线图出不来, 需要延长一天
  const times = shortcutDateRangePicker.value.times
  if (DateUtil.isSameDay(times[0], times[1])) {
    // 前天
    times[0] = DateUtil.formatDate(dayjs(times[0]).subtract(1, 'd'))
  }
  // 查询数据
  await Promise.all([getProductTrendSummary(), getProductStatisticsList()])
  trendLoading.value = false
}

/** 查询商品状况数据统计 */
const getProductTrendSummary = async () => {
  const times = shortcutDateRangePicker.value.times
  trendSummary.value = await ProductStatisticsApi.getProductStatisticsAnalyse({ times })
}

/** 查询商品状况数据列表 */
const getProductStatisticsList = async () => {
  // 查询数据
  const times = shortcutDateRangePicker.value.times
  const list: ProductStatisticsVO[] = await ProductStatisticsApi.getProductStatisticsList({ times })
  // 处理数据
  for (let item of list) {
    item.orderPayPrice = fenToYuan(item.orderPayPrice)
    item.afterSaleRefundPrice = fenToYuan(item.afterSaleRefundPrice)
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
    const data = await ProductStatisticsApi.exportProductStatisticsExcel({ times })
    download.excel(data, '商品状况.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}
</script>
<style lang="scss" scoped></style>
