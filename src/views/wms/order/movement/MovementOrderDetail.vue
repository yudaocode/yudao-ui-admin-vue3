<!-- WMS 移库单详情 -->
<template>
  <Dialog v-model="dialogVisible" title="移库单详情" width="1200px">
    <div v-loading="loading">
      <div class="mb-16px text-18px font-bold">单据信息</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="移库单号">{{ detailData.no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="来源仓库">
          {{ detailData.sourceWarehouseName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="目标仓库">
          {{ detailData.targetWarehouseName || '-' }}
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
        <el-descriptions-item label="总数量">
          {{ formatQuantity(detailData.totalQuantity) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="总金额">
          {{ formatPrice(detailData.totalPrice) || '-' }}
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
      <el-table :data="detailRows" :summary-method="getSummaries" border show-summary>
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
        <el-table-column align="right" label="数量" prop="quantity" width="120">
          <template #default="{ row }">{{ formatQuantity(row.quantity) || '-' }}</template>
        </el-table-column>
        <el-table-column align="right" label="单价(元)" prop="price" width="140">
          <template #default="{ row }">{{ formatPrice(row.price) || '-' }}</template>
        </el-table-column>
        <el-table-column align="right" label="金额(元)" prop="totalPrice" width="140">
          <template #default="{ row }">{{ formatPrice(row.totalPrice) || '-' }}</template>
        </el-table-column>
      </el-table>
    </div>
  </Dialog>
</template>

<script lang="ts" setup>
import { formatNullableDate } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { MovementOrderApi, MovementOrderVO } from '@/api/wms/order/movement'
import { MovementOrderDetailVO } from '@/api/wms/order/movement/detail'
import {
  formatPrice,
  formatQuantity,
  formatSumPrice,
  formatSumQuantity,
  multiplyPrice
} from '@/views/wms/utils/format'

/** WMS 移库单详情 */
defineOptions({ name: 'WmsMovementOrderDetail' })

const loading = ref(false)
const dialogVisible = ref(false)
const detailData = ref<MovementOrderVO>({})

interface DetailRow extends MovementOrderDetailVO {
  totalPrice?: number
}

const detailRows = computed<DetailRow[]>(() =>
  (detailData.value.details || []).map((detail) => ({
    ...detail,
    totalPrice: detail.totalPrice ?? multiplyPrice(detail.quantity, detail.price)
  }))
)

/** 计算表格的合计行数据 */
function getSummaries({ columns, data }: { columns: any[]; data: DetailRow[] }) {
  return columns.map((column, index) => {
    if (index === 0) {
      return '合计'
    }
    if (column.property === 'quantity') {
      return formatSumQuantity(data, (detail) => detail.quantity)
    }
    if (column.property === 'totalPrice') {
      return formatSumPrice(data, (detail) => detail.totalPrice)
    }
    return ''
  })
}

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  loading.value = true
  try {
    detailData.value = await MovementOrderApi.getMovementOrder(id)
  } finally {
    loading.value = false
  }
}
defineExpose({ open })
</script>
