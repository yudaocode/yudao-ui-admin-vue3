<template>
  <div
    class="mb-16px border border-[var(--el-border-color-light)] border-solid rounded-[var(--wms-card-radius)] bg-[var(--el-bg-color)] p-18px shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
  >
    <div
      class="mb-12px flex items-center justify-between gap-12px lt-sm:flex-col lt-sm:items-start"
    >
      <div>
        <div class="text-16px font-600 text-[var(--el-text-color-primary)]">单据趋势</div>
        <div class="text-13px text-[var(--el-text-color-secondary)]">
          入库、出库、移库、盘库单据数量
        </div>
      </div>
      <el-segmented
        v-model="trendDays"
        :options="trendDayOptions"
        @change="handleTrendDaysChange"
      />
    </div>
    <el-skeleton :loading="loading" animated>
      <Echart :height="330" :options="chartOptions" />
    </el-skeleton>
  </div>
</template>

<script lang="ts" setup>
import type { EChartsOption } from 'echarts'
import { WmsHomeStatisticsApi, type WmsHomeOrderTrendVO } from '@/api/wms/home'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { OrderTypeEnum } from '@/views/wms/utils/constants'

defineOptions({ name: 'WmsHomeOrderTrendChart' })

interface OrderDefinition {
  orderType: number
  title: string
  color: string
  trendField: keyof Pick<
    WmsHomeOrderTrendVO,
    'receiptCount' | 'shipmentCount' | 'movementCount' | 'checkCount'
  >
}

const orderDefinitions: OrderDefinition[] = [
  {
    orderType: OrderTypeEnum.RECEIPT,
    title: getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, OrderTypeEnum.RECEIPT).replace(/单$/, ''),
    color: '#2f7df6',
    trendField: 'receiptCount'
  },
  {
    orderType: OrderTypeEnum.SHIPMENT,
    title: getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, OrderTypeEnum.SHIPMENT).replace(/单$/, ''),
    color: '#18a058',
    trendField: 'shipmentCount'
  },
  {
    orderType: OrderTypeEnum.MOVEMENT,
    title: getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, OrderTypeEnum.MOVEMENT).replace(/单$/, ''),
    color: '#f59e0b',
    trendField: 'movementCount'
  },
  {
    orderType: OrderTypeEnum.CHECK,
    title: getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, OrderTypeEnum.CHECK).replace(/单$/, ''),
    color: '#7c3aed',
    trendField: 'checkCount'
  }
]
const trendDayOptions = [
  { label: '近7天', value: 7 },
  { label: '近30天', value: 30 }
]

const loading = ref(false)
const warehouseId = ref<number>()
const trendDays = ref(7)
const trendLabels = ref<string[]>([])
const trendSeriesMap = reactive<Record<number, number[]>>({
  [OrderTypeEnum.RECEIPT]: [],
  [OrderTypeEnum.SHIPMENT]: [],
  [OrderTypeEnum.MOVEMENT]: [],
  [OrderTypeEnum.CHECK]: []
})

const chartFontFamily =
  "Inter, 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif"
const chartTextStyle = {
  color: '#303133',
  fontFamily: chartFontFamily,
  fontSize: 12,
  fontWeight: 400,
  textBorderWidth: 0,
  textShadowBlur: 0
}
const chartAxisLabelStyle = {
  color: '#8a9099',
  fontFamily: chartFontFamily,
  fontSize: 12,
  textBorderWidth: 0,
  textShadowBlur: 0
}

/** 加载单据趋势数据 */
const load = async (selectedWarehouseId?: number) => {
  warehouseId.value = selectedWarehouseId
  loading.value = true
  try {
    const data = await WmsHomeStatisticsApi.getOrderTrend(
      trendDays.value,
      selectedWarehouseId ? { warehouseId: selectedWarehouseId } : {}
    )
    trendLabels.value = data.map((item) => formatDate(new Date(item.time), 'MM-DD'))
    orderDefinitions.forEach((definition) => {
      trendSeriesMap[definition.orderType] = data.map((item) =>
        Number(item[definition.trendField] || 0)
      )
    })
  } finally {
    loading.value = false
  }
}

/** 切换趋势统计天数 */
const handleTrendDaysChange = async () => {
  await load(warehouseId.value)
}

/** 单据趋势图表配置 */
const chartOptions = computed<EChartsOption>(() => ({
  color: orderDefinitions.map((item) => item.color),
  grid: { top: 48, left: 28, right: 24, bottom: 24, containLabel: true },
  textStyle: chartTextStyle,
  legend: { top: 6, itemWidth: 10, itemHeight: 10, textStyle: chartTextStyle },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: {
    type: 'category',
    data: trendLabels.value,
    axisLabel: chartAxisLabelStyle,
    axisTick: { show: false },
    axisLine: { lineStyle: { color: '#dcdfe6' } }
  },
  yAxis: {
    type: 'value',
    name: '单据数',
    nameTextStyle: chartAxisLabelStyle,
    axisLabel: chartAxisLabelStyle,
    minInterval: 1,
    splitLine: { lineStyle: { color: '#eef2f7' } }
  },
  series: orderDefinitions.map((item) => ({
    name: item.title,
    type: 'bar',
    barMaxWidth: 18,
    data: trendSeriesMap[item.orderType],
    emphasis: { focus: 'series' }
  }))
}))

defineExpose({ load })
</script>
