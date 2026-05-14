<template>
  <el-skeleton :loading="loading" animated>
    <template #template>
      <div class="mb-16px grid grid-cols-4 gap-16px lt-sm:grid-cols-1 lt-xl:grid-cols-2">
        <el-skeleton-item
          v-for="item in 4"
          :key="item"
          class="h-174px w-full rounded-[var(--wms-card-radius)]"
        />
      </div>
    </template>
    <div class="mb-16px grid grid-cols-4 gap-16px lt-sm:grid-cols-1 lt-xl:grid-cols-2">
      <div
        v-for="item in summaryList"
        :key="item.orderType"
        class="min-h-154px border border-t-3 border-[var(--el-border-color-light)] border-t-[var(--theme-color)] border-solid rounded-[var(--wms-card-radius)] bg-[var(--el-bg-color)] px-18px py-16px shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
        :style="{ '--theme-color': item.color }"
      >
        <div class="flex items-center justify-between gap-12px">
          <div
            class="flex items-center gap-8px text-15px font-600 text-[var(--el-text-color-primary)]"
          >
            <span class="h-8px w-8px rounded-full" :style="{ backgroundColor: item.color }"></span>
            {{ item.title }}
          </div>
          <el-button link type="primary" @click="handleNavigate(item.routeName)">查看</el-button>
        </div>
        <div class="mt-18px flex items-baseline gap-8px">
          <em class="not-italic text-[var(--el-text-color-secondary)]">合计</em>
          <span class="text-32px font-700 leading-38px text-[var(--el-text-color-primary)]">{{
            formatCount(item.total)
          }}</span>
          <em class="not-italic text-[var(--el-text-color-secondary)]">单</em>
        </div>
        <div
          class="mt-14px h-8px flex overflow-hidden rounded-full bg-[var(--el-fill-color-light)]"
        >
          <span
            v-for="status in statusList"
            :key="status.value"
            class="h-full"
            :style="{
              width: getStatusPercent(item, status.value),
              backgroundColor: status.color
            }"
          ></span>
        </div>
        <div class="mt-14px grid grid-cols-3 gap-8px">
          <div v-for="status in statusList" :key="status.value" class="min-w-0">
            <span class="block truncate text-12px text-[var(--el-text-color-secondary)]">
              {{ status.label }}
            </span>
            <strong class="mt-2px block text-16px" :style="{ color: status.color }">{{
              item.statusCounts[status.value]
            }}</strong>
          </div>
        </div>
      </div>
    </div>
  </el-skeleton>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { WmsHomeStatisticsApi } from '@/api/wms/home'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { OrderStatusEnum } from '@/views/wms/utils/constants'

defineOptions({ name: 'WmsHomeOrderSummaryCards' })

interface StatusItem {
  label: string
  value: number
  color: string
}

interface OrderDefinition {
  orderType: number
  title: string
  color: string
  routeName: string
}

interface OrderSummaryItem extends OrderDefinition {
  total: number
  statusCounts: Record<number, number>
}

const router = useRouter()
const message = useMessage()

const OrderTypeEnum = {
  RECEIPT: 1,
  SHIPMENT: 2,
  MOVEMENT: 3,
  CHECK: 4
} as const

/** 获取单据类型名称 */
const getOrderTypeTitle = (type: number, defaultTitle: string) => {
  const label = getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, type) || defaultTitle
  return label.endsWith('单') ? label.slice(0, -1) : label
}

/** 获取单据状态名称 */
const getOrderStatusLabel = (status: number, defaultLabel: string) => {
  return getDictLabel(DICT_TYPE.WMS_ORDER_STATUS, status) || defaultLabel
}

const loading = ref(false)
const statusList: StatusItem[] = [
  {
    label: getOrderStatusLabel(OrderStatusEnum.PREPARE, '草稿'),
    value: OrderStatusEnum.PREPARE,
    color: '#409eff'
  },
  {
    label: getOrderStatusLabel(OrderStatusEnum.FINISHED, '已完成'),
    value: OrderStatusEnum.FINISHED,
    color: '#67c23a'
  },
  {
    label: getOrderStatusLabel(OrderStatusEnum.CANCELED, '已作废'),
    value: OrderStatusEnum.CANCELED,
    color: '#909399'
  }
]
const orderDefinitions: OrderDefinition[] = [
  {
    orderType: OrderTypeEnum.RECEIPT,
    title: getOrderTypeTitle(OrderTypeEnum.RECEIPT, '入库'),
    color: '#2f7df6',
    routeName: 'WmsReceiptOrder'
  },
  {
    orderType: OrderTypeEnum.SHIPMENT,
    title: getOrderTypeTitle(OrderTypeEnum.SHIPMENT, '出库'),
    color: '#18a058',
    routeName: 'WmsShipmentOrder'
  },
  {
    orderType: OrderTypeEnum.MOVEMENT,
    title: getOrderTypeTitle(OrderTypeEnum.MOVEMENT, '移库'),
    color: '#f59e0b',
    routeName: 'WmsMovementOrder'
  },
  {
    orderType: OrderTypeEnum.CHECK,
    title: getOrderTypeTitle(OrderTypeEnum.CHECK, '盘库'),
    color: '#7c3aed',
    routeName: 'WmsCheckOrder'
  }
]

/** 构建默认的状态数量集合 */
const buildEmptyStatusCounts = () => {
  return statusList.reduce(
    (result, status) => {
      result[status.value] = 0
      return result
    },
    {} as Record<number, number>
  )
}

const summaryList = ref<OrderSummaryItem[]>(
  orderDefinitions.map((item) => ({
    ...item,
    total: 0,
    statusCounts: buildEmptyStatusCounts()
  }))
)

/** 加载单据汇总数据 */
const load = async (warehouseId?: number) => {
  loading.value = true
  try {
    const data = await WmsHomeStatisticsApi.getOrderSummary(warehouseId ? { warehouseId } : {})
    summaryList.value = orderDefinitions.map((definition) => {
      const summary = data.find((item) => item.type === definition.orderType)
      const statusCounts = statusList.reduce((result, status) => {
        const statusItem = summary?.statuses?.find((item) => item.status === status.value)
        result[status.value] = statusItem?.count || 0
        return result
      }, buildEmptyStatusCounts())
      return {
        ...definition,
        total: summary?.total || 0,
        statusCounts
      }
    })
  } finally {
    loading.value = false
  }
}

/** 跳转到对应单据列表 */
const handleNavigate = async (name: string) => {
  try {
    await router.push({ name })
  } catch {
    message.warning('当前菜单尚未加载，请从左侧菜单进入对应页面')
  }
}

/** 计算状态进度条占比 */
const getStatusPercent = (item: OrderSummaryItem, status: number) => {
  const count = item.statusCounts[status] || 0
  if (!item.total || !count) {
    return '0%'
  }
  return `${Math.max((count / item.total) * 100, 4)}%`
}

/** 格式化单据数量 */
const formatCount = (value: number) => value.toLocaleString()

defineExpose({ load })
</script>
