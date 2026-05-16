<template>
  <doc-alert title="WMS 手册（功能开启）" url="https://doc.iocoder.cn/wms/build/" />

  <div class="[--wms-card-radius:8px]">
    <div
      class="mb-16px flex flex-wrap justify-between gap-16px rounded-[var(--wms-card-radius)] border border-[var(--el-border-color-light)] border-solid bg-[var(--el-bg-color)] p-16px"
    >
      <div
        class="flex min-w-320px flex-1 flex-wrap items-center justify-between gap-16px lt-sm:w-full"
      >
        <div>
          <div class="text-20px font-600 leading-28px text-[var(--el-text-color-primary)]">
            WMS 首页
          </div>
          <div class="text-13px text-[var(--el-text-color-secondary)]">单据工作台 / 库存概览</div>
        </div>
        <div class="flex flex-wrap items-center gap-8px lt-sm:w-full">
          <WarehouseSelect
            v-model="warehouseId"
            class="!w-220px"
            placeholder="全部仓库"
            @change="refresh()"
          />
          <el-button :loading="loading" @click="refresh">
            <Icon class="mr-5px" icon="ep:refresh" />
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <WmsHomeOrderSummaryCards ref="orderSummaryCardsRef" />
    <WmsHomeOrderTrendChart ref="orderTrendChartRef" />
    <WmsHomeInventoryCharts ref="inventoryChartsRef" />

    <div
      class="mt-2px flex items-center justify-center text-13px text-[var(--el-text-color-secondary)]"
    >
      <Icon class="mr-5px" icon="ep:clock" />
      统计时间：{{ statTime }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import WarehouseSelect from '@/views/wms/md/warehouse/components/WarehouseSelect.vue'
import WmsHomeInventoryCharts from './components/WmsHomeInventoryCharts.vue'
import WmsHomeOrderSummaryCards from './components/WmsHomeOrderSummaryCards.vue'
import WmsHomeOrderTrendChart from './components/WmsHomeOrderTrendChart.vue'

/** WMS 首页 */
defineOptions({ name: 'WmsHome' })

const loading = ref(false)
const warehouseId = ref<number>()
const statTime = ref(formatDate(new Date()))
const orderSummaryCardsRef = ref<InstanceType<typeof WmsHomeOrderSummaryCards>>()
const orderTrendChartRef = ref<InstanceType<typeof WmsHomeOrderTrendChart>>()
const inventoryChartsRef = ref<InstanceType<typeof WmsHomeInventoryCharts>>()

/** 刷新：重新加载各个组件的数据（传入 warehouseId 以进行针对性查询），并更新时间戳 */
const refresh = async () => {
  loading.value = true
  try {
    await Promise.all([
      orderSummaryCardsRef.value?.load(warehouseId.value),
      orderTrendChartRef.value?.load(warehouseId.value),
      inventoryChartsRef.value?.load(warehouseId.value)
    ])
    statTime.value = formatDate(new Date())
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refresh()
})
</script>
