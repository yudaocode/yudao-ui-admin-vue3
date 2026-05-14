<!-- TODO @AI：组件拆分下。 -->
<template>
  <div class="wms-home">
    <div class="wms-home__toolbar">
      <div class="wms-home__toolbar-main">
        <div>
          <div class="wms-home__title">WMS 首页</div>
          <div class="wms-home__subtitle">单据工作台 / 库存概览</div>
        </div>
        <div class="wms-home__filters">
          <el-select
            v-model="warehouseId"
            class="!w-220px"
            clearable
            filterable
            placeholder="全部仓库"
            @change="refresh"
          >
            <el-option
              v-for="warehouse in warehouseList"
              :key="warehouse.id!"
              :label="warehouse.name"
              :value="warehouse.id!"
            />
          </el-select>
          <el-button :loading="loading || trendLoading || inventoryLoading" @click="refresh">
            <Icon class="mr-5px" icon="ep:refresh" />
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <el-skeleton :loading="loading" animated>
      <template #template>
        <div class="wms-home__summary-grid">
          <el-skeleton-item v-for="item in 4" :key="item" class="wms-home__summary-skeleton" />
        </div>
      </template>
      <div class="wms-home__summary-grid">
        <div
          v-for="item in orderSummaries"
          :key="item.key"
          class="wms-home__summary-card"
          :style="{ '--theme-color': item.color }"
        >
          <div class="wms-home__summary-head">
            <div class="wms-home__summary-title">
              <span :style="{ backgroundColor: item.color }"></span>
              {{ item.title }}
            </div>
            <el-button link type="primary" @click="handleNavigate(item.routeName)">查看</el-button>
          </div>
          <div class="wms-home__summary-total">
            <em>合计</em>
            <span>{{ formatCount(item.total) }}</span>
            <em>单</em>
          </div>
          <div class="wms-home__status-bar">
            <span
              v-for="status in statusList"
              :key="status.key"
              :style="{
                width: getStatusPercent(item, status.key),
                backgroundColor: status.color
              }"
            ></span>
          </div>
          <div class="wms-home__status-list">
            <div v-for="status in statusList" :key="status.key">
              <span>{{ status.label }}</span>
              <strong :style="{ color: status.color }">{{ item.statusCounts[status.key] }}</strong>
            </div>
          </div>
        </div>
      </div>
    </el-skeleton>

    <div class="wms-home__chart-card">
      <div class="wms-home__card-head">
        <div>
          <div class="wms-home__card-title">单据趋势</div>
          <div class="wms-home__card-subtitle">入库、出库、移库、盘库单据数量</div>
        </div>
        <el-segmented v-model="trendDays" :options="trendDayOptions" @change="loadTrendData" />
      </div>
      <el-skeleton :loading="trendLoading" animated>
        <Echart :height="330" :options="trendChartOptions" />
      </el-skeleton>
    </div>

    <el-row :gutter="16">
      <el-col :lg="12" :md="24" :sm="24" :xl="12" :xs="24">
        <div class="wms-home__chart-card">
          <div class="wms-home__card-head">
            <div>
              <div class="wms-home__card-title">货物占比</div>
              <div class="wms-home__card-subtitle">按商品库存数量汇总 Top 5</div>
            </div>
          </div>
          <el-skeleton :loading="inventoryLoading" animated>
            <Echart :height="300" :options="goodsShareChartOptions" />
          </el-skeleton>
        </div>
      </el-col>
      <el-col :lg="12" :md="24" :sm="24" :xl="12" :xs="24">
        <div class="wms-home__chart-card">
          <div class="wms-home__card-head">
            <div>
              <div class="wms-home__card-title">库存分布</div>
              <div class="wms-home__card-subtitle">按仓库库存数量汇总</div>
            </div>
            <div class="wms-home__total-quantity"
              >总库存 {{ formatQuantityText(totalQuantity) }}</div
            >
          </div>
          <el-skeleton :loading="inventoryLoading" animated>
            <Echart :height="300" :options="inventoryDistributionChartOptions" />
          </el-skeleton>
        </div>
      </el-col>
    </el-row>

    <div class="wms-home__stat-time">
      <Icon class="mr-5px" icon="ep:clock" />
      统计时间：{{ statTime }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { EChartsOption } from 'echarts'
import { useRouter } from 'vue-router'
import { WmsHomeOrderTrendVO, WmsHomeStatisticsApi, WmsHomeStatisticsReqVO } from '@/api/wms/home'
import { WarehouseApi, WarehouseVO } from '@/api/wms/md/warehouse'
import { OrderStatusEnum } from '@/views/wms/utils/constants'
import { formatQuantity } from '@/views/wms/utils/format'
import { formatDate } from '@/utils/formatTime'

/** WMS 首页 */
defineOptions({ name: 'WmsHome' })

type StatusKey = 'prepare' | 'finished' | 'canceled'
type OrderKey = 'receipt' | 'shipment' | 'movement' | 'check'

interface OrderDefinition {
  key: OrderKey
  orderType: number
  title: string
  color: string
  routeName: string
  trendField: keyof Pick<
    WmsHomeOrderTrendVO,
    'receiptCount' | 'shipmentCount' | 'movementCount' | 'checkCount'
  >
}

interface OrderSummary extends OrderDefinition {
  total: number
  statusCounts: Record<StatusKey, number>
}

interface ChartItem {
  name: string
  value: number
}

const router = useRouter()
const message = useMessage()

const statusList: Array<{ key: StatusKey; label: string; value: number; color: string }> = [
  { key: 'prepare', label: '草稿', value: OrderStatusEnum.PREPARE, color: '#409eff' },
  { key: 'finished', label: '已完成', value: OrderStatusEnum.FINISHED, color: '#67c23a' },
  { key: 'canceled', label: '已作废', value: OrderStatusEnum.CANCELED, color: '#909399' }
]

const OrderTypeEnum = {
  RECEIPT: 1,
  SHIPMENT: 2,
  MOVEMENT: 3,
  CHECK: 4
} as const

const orderDefinitions: OrderDefinition[] = [
  {
    key: 'receipt',
    orderType: OrderTypeEnum.RECEIPT,
    title: '入库',
    color: '#2f7df6',
    routeName: 'WmsReceiptOrder',
    trendField: 'receiptCount'
  },
  {
    key: 'shipment',
    orderType: OrderTypeEnum.SHIPMENT,
    title: '出库',
    color: '#18a058',
    routeName: 'WmsShipmentOrder',
    trendField: 'shipmentCount'
  },
  {
    key: 'movement',
    orderType: OrderTypeEnum.MOVEMENT,
    title: '移库',
    color: '#f59e0b',
    routeName: 'WmsMovementOrder',
    trendField: 'movementCount'
  },
  {
    key: 'check',
    orderType: OrderTypeEnum.CHECK,
    title: '盘库',
    color: '#7c3aed',
    routeName: 'WmsCheckOrder',
    trendField: 'checkCount'
  }
]

const trendDayOptions = [
  { label: '近7天', value: 7 },
  { label: '近30天', value: 30 }
]

const loading = ref(false)
const trendLoading = ref(false)
const inventoryLoading = ref(false)
const warehouseId = ref<number>()
const warehouseList = ref<WarehouseVO[]>([])
const statTime = ref(formatDate(new Date()))
const orderSummaries = ref<OrderSummary[]>(
  orderDefinitions.map((item) => ({
    ...item,
    total: 0,
    statusCounts: { prepare: 0, finished: 0, canceled: 0 }
  }))
)
const trendDays = ref(7)
const trendLabels = ref<string[]>([])
const trendSeriesMap = reactive<Record<OrderKey, number[]>>({
  receipt: [],
  shipment: [],
  movement: [],
  check: []
})
const totalQuantity = ref(0)
const goodsShareList = ref<ChartItem[]>([])
const inventoryDistributionList = ref<ChartItem[]>([])

const getStatisticsParams = (): WmsHomeStatisticsReqVO => {
  return warehouseId.value ? { warehouseId: warehouseId.value } : {}
}

const loadOrderSummaries = async () => {
  const data = await WmsHomeStatisticsApi.getOrderSummary(getStatisticsParams())
  orderSummaries.value = orderDefinitions.map((definition) => {
    const summary = data.find((item) => item.orderType === definition.orderType)
    const statusCounts = statusList.reduce(
      (result, status) => {
        const statusItem = summary?.statusList?.find((item) => item.status === status.value)
        result[status.key] = statusItem?.count || 0
        return result
      },
      { prepare: 0, finished: 0, canceled: 0 } as Record<StatusKey, number>
    )
    return {
      ...definition,
      total: summary?.total || 0,
      statusCounts
    }
  })
}

const buildChartItemList = <T,>(
  list: T[] | undefined,
  nameGetter: (item: T) => string,
  valueGetter: (item: T) => number | undefined
) => {
  return (list || [])
    .map((item) => ({
      name: nameGetter(item),
      value: Number(valueGetter(item) || 0)
    }))
    .filter((item) => item.value > 0)
}

const loadTrendData = async () => {
  trendLoading.value = true
  try {
    const data = await WmsHomeStatisticsApi.getOrderTrend(trendDays.value, getStatisticsParams())
    trendLabels.value = data.map((item) => item.date.substring(5))
    orderDefinitions.forEach((definition) => {
      trendSeriesMap[definition.key] = data.map((item) => Number(item[definition.trendField] || 0))
    })
  } finally {
    trendLoading.value = false
  }
}

const loadInventoryData = async () => {
  inventoryLoading.value = true
  try {
    const data = await WmsHomeStatisticsApi.getInventorySummary(getStatisticsParams())
    totalQuantity.value = Number(data.totalQuantity || 0)
    goodsShareList.value = buildChartItemList(
      data.goodsShareList,
      (item) => item.itemName || '未命名商品',
      (item) => item.quantity
    )
    inventoryDistributionList.value = buildChartItemList(
      data.warehouseDistributionList,
      (item) => item.warehouseName || '未指定仓库',
      (item) => item.quantity
    )
  } finally {
    inventoryLoading.value = false
  }
}

const refresh = async () => {
  loading.value = true
  try {
    await Promise.all([loadOrderSummaries(), loadTrendData(), loadInventoryData()])
    statTime.value = formatDate(new Date())
  } finally {
    loading.value = false
  }
}

const loadWarehouseList = async () => {
  warehouseList.value = await WarehouseApi.getWarehouseSimpleList()
}

const handleNavigate = async (name: string) => {
  try {
    await router.push({ name })
  } catch {
    message.warning('当前菜单尚未加载，请从左侧菜单进入对应页面')
  }
}

const getStatusPercent = (item: OrderSummary, key: StatusKey) => {
  if (!item.total) {
    return `${100 / statusList.length}%`
  }
  return `${Math.max((item.statusCounts[key] / item.total) * 100, 4)}%`
}

const formatCount = (value: number) => value.toLocaleString()
const formatQuantityText = (value: number) => formatQuantity(value) || '0.00'
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

const formatGoodsLegend = (name: string) => {
  const total = goodsShareList.value.reduce((sum, item) => sum + item.value, 0)
  const item = goodsShareList.value.find((goods) => goods.name === name)
  if (!total || !item) {
    return name
  }
  return `${name}  ${((item.value / total) * 100).toFixed(1)}%`
}

const trendChartOptions = computed<EChartsOption>(() => ({
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
    data: trendSeriesMap[item.key],
    emphasis: { focus: 'series' }
  }))
}))

const goodsShareChartOptions = computed<EChartsOption>(() => ({
  color: ['#2f7df6', '#18a058', '#f59e0b', '#7c3aed', '#14b8a6'],
  textStyle: chartTextStyle,
  tooltip: {
    trigger: 'item',
    formatter: '{b}<br/>库存：{c} ({d}%)'
  },
  legend: {
    type: 'scroll',
    orient: 'vertical',
    right: 10,
    top: 'middle',
    itemWidth: 10,
    itemHeight: 10,
    formatter: formatGoodsLegend,
    textStyle: chartTextStyle
  },
  series: [
    {
      name: '货物占比',
      type: 'pie',
      radius: ['48%', '70%'],
      center: ['34%', '52%'],
      avoidLabelOverlap: true,
      label: { show: false },
      labelLine: { show: false },
      data: goodsShareList.value
    }
  ]
}))

const inventoryDistributionChartOptions = computed<EChartsOption>(() => ({
  color: ['#2f7df6'],
  grid: { top: 12, left: 24, right: 40, bottom: 16, containLabel: true },
  textStyle: chartTextStyle,
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: (params: any) => {
      const item = Array.isArray(params) ? params[0] : params
      return `${item.name}<br/>库存：${formatQuantityText(item.value)}`
    }
  },
  xAxis: {
    type: 'value',
    axisLabel: chartAxisLabelStyle,
    splitLine: { lineStyle: { color: '#eef2f7' } }
  },
  yAxis: {
    type: 'category',
    data: inventoryDistributionList.value.map((item) => item.name).reverse(),
    axisLabel: chartAxisLabelStyle,
    axisTick: { show: false },
    axisLine: { show: false }
  },
  series: [
    {
      name: '库存',
      type: 'bar',
      barMaxWidth: 16,
      data: inventoryDistributionList.value.map((item) => item.value).reverse(),
      label: {
        show: true,
        position: 'right',
        ...chartTextStyle,
        formatter: ({ value }) => formatQuantityText(Number(value))
      }
    }
  ]
}))

onMounted(async () => {
  loading.value = true
  try {
    await loadWarehouseList()
    await refresh()
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.wms-home {
  --wms-card-radius: 8px;
}

.wms-home__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--wms-card-radius);
}

.wms-home__toolbar-main {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  min-width: 320px;
}

.wms-home__title {
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  color: var(--el-text-color-primary);
}

.wms-home__subtitle,
.wms-home__card-subtitle,
.wms-home__stat-time {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.wms-home__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.wms-home__summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.wms-home__summary-skeleton {
  width: 100%;
  height: 174px;
  border-radius: var(--wms-card-radius);
}

.wms-home__summary-card,
.wms-home__chart-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--wms-card-radius);
  box-shadow: 0 8px 24px rgb(15 23 42 / 4%);
}

.wms-home__summary-card {
  min-height: 154px;
  padding: 16px 18px;
  border-top: 3px solid var(--theme-color);
}

.wms-home__summary-head,
.wms-home__card-head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.wms-home__summary-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.wms-home__summary-title span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.wms-home__summary-total {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin-top: 18px;
}

.wms-home__summary-total span {
  font-size: 32px;
  font-weight: 700;
  line-height: 38px;
  color: var(--el-text-color-primary);
}

.wms-home__summary-total em {
  font-style: normal;
  color: var(--el-text-color-secondary);
}

.wms-home__status-bar {
  display: flex;
  height: 8px;
  margin-top: 14px;
  overflow: hidden;
  background: var(--el-fill-color-light);
  border-radius: 999px;
}

.wms-home__status-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}

.wms-home__status-list div {
  min-width: 0;
}

.wms-home__status-list span {
  display: block;
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wms-home__status-list strong {
  display: block;
  margin-top: 2px;
  font-size: 16px;
}

.wms-home__chart-card {
  margin-bottom: 16px;
  padding: 18px;
}

.wms-home__card-head {
  margin-bottom: 12px;
}

.wms-home__card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.wms-home__total-quantity {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.wms-home__stat-time {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

@media (max-width: 1200px) {
  .wms-home__summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .wms-home__toolbar-main,
  .wms-home__filters {
    width: 100%;
  }

  .wms-home__summary-grid {
    grid-template-columns: 1fr;
  }

  .wms-home__card-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
