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
          <span class="text-32px font-700 leading-38px text-[var(--el-text-color-primary)]">
            {{ item.total?.toLocaleString() }}
          </span>
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
            <strong class="mt-2px block text-16px" :style="{ color: status.color }">
              {{ item.statusCounts?.[status.value] }}
            </strong>
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
import { OrderStatusEnum, OrderTypeEnum } from '@/views/wms/utils/constants'

defineOptions({ name: 'WmsHomeOrderSummaryCards' })

interface StatusItem {
  label: string
  value: number
  color: string
}

interface OrderSummaryItem {
  orderType: number
  title: string
  color: string
  routeName: string
  total?: number
  statusCounts?: Partial<Record<number, number>>
}

const router = useRouter()
const message = useMessage()

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
const orderDefinitions: OrderSummaryItem[] = [
  {
    orderType: OrderTypeEnum.RECEIPT,
    title: getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, OrderTypeEnum.RECEIPT).replace(/单$/, ''),
    color: '#2f7df6',
    routeName: 'WmsReceiptOrder'
  },
  {
    orderType: OrderTypeEnum.SHIPMENT,
    title: getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, OrderTypeEnum.SHIPMENT).replace(/单$/, ''),
    color: '#18a058',
    routeName: 'WmsShipmentOrder'
  },
  {
    orderType: OrderTypeEnum.MOVEMENT,
    title: getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, OrderTypeEnum.MOVEMENT).replace(/单$/, ''),
    color: '#f59e0b',
    routeName: 'WmsMovementOrder'
  },
  {
    orderType: OrderTypeEnum.CHECK,
    title: getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, OrderTypeEnum.CHECK).replace(/单$/, ''),
    color: '#7c3aed',
    routeName: 'WmsCheckOrder'
  }
]

const summaryList = ref<OrderSummaryItem[]>(orderDefinitions)

/** 加载单据汇总数据 */
const load = async (warehouseId?: number) => {
  loading.value = true
  try {
    const data = await WmsHomeStatisticsApi.getOrderSummary(warehouseId ? { warehouseId } : {})
    summaryList.value = orderDefinitions.map((definition) => {
      const summary = data.find((item) => item.type === definition.orderType)
      const statusCounts = summary?.statuses?.reduce(
        (result, item) => {
          result[item.status] = item.count
          return result
        },
        {} as Partial<Record<number, number>>
      )
      return {
        ...definition,
        total: summary?.total,
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
function getStatusPercent(item: OrderSummaryItem, status: number) {
  const count = item.statusCounts?.[status]
  if (item.total === undefined || count === undefined) {
    return undefined
  }
  if (item.total === 0) {
    return '0%'
  }
  return `${(count / item.total) * 100}%`
}

defineExpose({ load })
</script>
