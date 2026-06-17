<!-- WMS 盘库单详情 -->
<template>
  <Dialog v-model="dialogVisible" title="盘库单详情" width="1200px">
    <div v-loading="loading">
      <div class="mb-16px text-18px font-bold">单据信息</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="盘库单号">{{ detailData.no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="仓库">
          {{ detailData.warehouseName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="单据日期">
          {{ formatNullableDate(detailData.orderTime, 'YYYY-MM-DD') }}
        </el-descriptions-item>
        <el-descriptions-item label="单据状态">
          <dict-tag
            v-if="detailData.status !== undefined"
            :type="DICT_TYPE.WMS_ORDER_STATUS"
            :value="detailData.status"
          />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="盈亏数量">
          <span :class="getLossClass(detailData.totalQuantity)">
            {{ formatQuantity(detailData.totalQuantity) || '-' }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="总金额">
          {{ formatPrice(detailData.totalPrice) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="实际金额">
          {{ formatPrice(detailData.actualPrice) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="实际盈亏金额">
          <span :class="getLossClass(getOrderDifferencePrice(detailData))">
            {{ formatPrice(getOrderDifferencePrice(detailData)) || '-' }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatNullableDate(detailData.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="创建人">
          {{ detailData.creatorName || detailData.creator || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ formatNullableDate(detailData.updateTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="更新人">
          {{ detailData.updaterName || detailData.updater || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :span="2" label="备注">
          {{ detailData.remark || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="mb-16px mt-24px text-18px font-bold">商品明细</div>
      <el-table :data="detailData.details || []" :summary-method="getSummaries" border show-summary>
        <el-table-column label="商品信息" min-width="200">
          <template #default="{ row }">
            <div>{{ row.itemName || '-' }}</div>
            <div v-if="row.itemCode" class="text-12px text-gray-500">
              商品编号：{{ row.itemCode }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="规格信息" min-width="200">
          <template #default="{ row }">
            <div>{{ row.skuName || '-' }}</div>
            <div v-if="row.skuCode" class="text-12px text-gray-500">
              规格编号：{{ row.skuCode }}
            </div>
          </template>
        </el-table-column>
        <el-table-column align="right" label="账面数量" prop="quantity" width="120">
          <template #default="{ row }">{{ formatQuantity(row.quantity) || '-' }}</template>
        </el-table-column>
        <el-table-column align="right" label="单价(元)" prop="price" width="120">
          <template #default="{ row }">{{ formatPrice(row.price) || '-' }}</template>
        </el-table-column>
        <el-table-column align="right" label="实盘数量" prop="checkQuantity" width="120">
          <template #default="{ row }">{{ formatQuantity(row.checkQuantity) || '-' }}</template>
        </el-table-column>
        <el-table-column align="right" label="实际金额(元)" prop="actualPrice" width="140">
          <template #default="{ row }">{{ formatPrice(getActualPrice(row)) || '-' }}</template>
        </el-table-column>
        <el-table-column align="right" label="盈亏数量" prop="differenceQuantity" width="120">
          <template #default="{ row }">
            <span :class="getLossClass(getDifferenceQuantity(row))">
              {{ formatQuantity(getDifferenceQuantity(row)) || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column align="right" label="实际盈亏金额(元)" prop="differencePrice" width="160">
          <template #default="{ row }">
            <span :class="getLossClass(getDifferencePrice(row))">{{
              formatPrice(getDifferencePrice(row)) || '-'
            }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </Dialog>
</template>

<script lang="ts" setup>
import { h } from 'vue'
import { formatNullableDate } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { CheckOrderApi, CheckOrderVO } from '@/api/wms/order/check'
import { CheckOrderDetailVO } from '@/api/wms/order/check/detail'
import {
  formatPrice,
  formatQuantity,
  formatSumPrice,
  formatSumQuantity,
  getLossClass,
  roundPrice,
  sumPrice,
  sumQuantity
} from '@/views/wms/utils/format'

/** WMS 盘库单详情 */
defineOptions({ name: 'WmsCheckOrderDetail' })

const loading = ref(false)
const dialogVisible = ref(false)
const detailData = ref<CheckOrderVO>({})

function getOrderDifferencePrice(order: CheckOrderVO) {
  return roundPrice(Number(order.actualPrice || 0) - Number(order.totalPrice || 0))
}

function getDifferenceQuantity(detail: CheckOrderDetailVO) {
  return Number(detail.checkQuantity || 0) - Number(detail.quantity || 0)
}

function getActualPrice(detail: CheckOrderDetailVO) {
  if (
    detail.checkQuantity === undefined ||
    detail.checkQuantity === null ||
    detail.price === undefined ||
    detail.price === null
  ) {
    return undefined
  }
  return roundPrice(Number(detail.checkQuantity) * Number(detail.price))
}
function getDifferencePrice(detail: CheckOrderDetailVO) {
  if (detail.price === undefined || detail.price === null) {
    return undefined
  }
  return roundPrice(getDifferenceQuantity(detail) * Number(detail.price))
}
function renderLossText(
  value: number | string | null | undefined,
  formatter: (value?: number | string | null) => string
) {
  return h('span', { class: getLossClass(value) }, formatter(value))
}

/** 计算表格的合计行数据 */
function getSummaries({ columns, data }: { columns: any[]; data: CheckOrderDetailVO[] }) {
  return columns.map((column, index) => {
    if (index === 0) {
      return '合计'
    }
    if (column.property === 'quantity') {
      return formatSumQuantity(data, (detail) => detail.quantity)
    }
    if (column.property === 'checkQuantity') {
      return formatSumQuantity(data, (detail) => detail.checkQuantity)
    }
    if (column.property === 'actualPrice') {
      return formatSumPrice(data, (detail) => getActualPrice(detail))
    }
    if (column.property === 'differenceQuantity') {
      return renderLossText(
        sumQuantity(data, (detail) => getDifferenceQuantity(detail)),
        formatQuantity
      )
    }
    if (column.property === 'differencePrice') {
      return renderLossText(
        sumPrice(data, (detail) => getDifferencePrice(detail)),
        formatPrice
      )
    }
    return ''
  })
}

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  loading.value = true
  try {
    detailData.value = await CheckOrderApi.getCheckOrder(id)
  } finally {
    loading.value = false
  }
}
defineExpose({ open })
</script>
