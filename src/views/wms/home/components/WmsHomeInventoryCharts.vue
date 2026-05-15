<template>
  <el-row :gutter="16">
    <el-col :lg="12" :md="24" :sm="24" :xl="12" :xs="24">
      <div
        class="mb-16px border border-[var(--el-border-color-light)] border-solid rounded-[var(--wms-card-radius)] bg-[var(--el-bg-color)] p-18px shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
      >
        <div
          class="mb-12px flex items-center justify-between gap-12px lt-sm:flex-col lt-sm:items-start"
        >
          <div>
            <div class="text-16px font-600 text-[var(--el-text-color-primary)]">货物占比</div>
            <div class="text-13px text-[var(--el-text-color-secondary)]">
              按商品库存数量汇总 Top 5
            </div>
          </div>
        </div>
        <el-skeleton :loading="loading" animated>
          <Echart :height="300" :options="goodsShareChartOptions" />
        </el-skeleton>
      </div>
    </el-col>
    <el-col :lg="12" :md="24" :sm="24" :xl="12" :xs="24">
      <div
        class="mb-16px border border-[var(--el-border-color-light)] border-solid rounded-[var(--wms-card-radius)] bg-[var(--el-bg-color)] p-18px shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
      >
        <div
          class="mb-12px flex items-center justify-between gap-12px lt-sm:flex-col lt-sm:items-start"
        >
          <div>
            <div class="text-16px font-600 text-[var(--el-text-color-primary)]">库存分布</div>
            <div class="text-13px text-[var(--el-text-color-secondary)]">按仓库库存数量汇总</div>
          </div>
          <div class="text-14px font-600 text-[var(--el-text-color-primary)]">
            总库存 {{ formatQuantityText(totalQuantity) }}
          </div>
        </div>
        <el-skeleton :loading="loading" animated>
          <Echart :height="300" :options="inventoryDistributionChartOptions" />
        </el-skeleton>
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import type { EChartsOption } from 'echarts'
import { WmsHomeStatisticsApi } from '@/api/wms/home'
import { formatQuantity } from '@/views/wms/utils/format'

defineOptions({ name: 'WmsHomeInventoryCharts' })

interface ChartItem {
  name: string
  value: number
}

const GOODS_SHARE_LIMIT = 5
const WAREHOUSE_DISTRIBUTION_LIMIT = 8

const loading = ref(false)
const totalQuantity = ref(0)
const goodsShareList = ref<ChartItem[]>([])
const inventoryDistributionList = ref<ChartItem[]>([])

/** 格式化库存数量展示 */
function formatQuantityText(value: number) {
  return formatQuantity(value) || '0.00'
}

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

/** 构建图表数据项，并过滤零库存数据 */
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

/** 格式化货物占比图例，补充库存占比 */
const formatGoodsLegend = (name: string) => {
  const total = goodsShareList.value.reduce((sum, item) => sum + item.value, 0)
  const item = goodsShareList.value.find((goods) => goods.name === name)
  if (!total || !item) {
    return name
  }
  return `${name}  ${((item.value / total) * 100).toFixed(1)}%`
}

/** 加载库存汇总数据 */
const load = async (warehouseId?: number) => {
  loading.value = true
  try {
    const data = await WmsHomeStatisticsApi.getInventorySummary({
      ...(warehouseId ? { warehouseId } : {}),
      goodsLimit: GOODS_SHARE_LIMIT,
      warehouseLimit: WAREHOUSE_DISTRIBUTION_LIMIT
    })
    totalQuantity.value = Number(data.totalQuantity || 0)
    goodsShareList.value = buildChartItemList(
      data.goodsShareList,
      (item) => item.name || '未命名商品',
      (item) => item.quantity
    )
    inventoryDistributionList.value = buildChartItemList(
      data.warehouseDistributionList,
      (item) => item.name || '未指定仓库',
      (item) => item.quantity
    )
  } finally {
    loading.value = false
  }
}

/** 货物占比图表配置 */
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

/** 库存分布图表配置 */
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

defineExpose({ load })
</script>
