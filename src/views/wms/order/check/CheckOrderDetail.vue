<!-- WMS 盘库单详情 -->
<template>
  <Dialog v-model="dialogVisible" title="盘库单详情" width="1200px">
    <div v-loading="loading">
      <div class="mb-16px text-18px font-bold">单据信息</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="盘库单号">{{ detailData.no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="单据状态">
          <dict-tag
            v-if="detailData.status !== undefined"
            :type="DICT_TYPE.WMS_ORDER_STATUS"
            :value="detailData.status"
          />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="仓库">{{ detailData.warehouseName || '-' }}</el-descriptions-item>
        <el-descriptions-item v-if="AREA_ENABLE" label="库区">{{ detailData.areaName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="盈亏数量">
          {{ formatQuantity(detailData.totalQuantity) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="总金额">
          {{ formatPrice(detailData.totalAmount) || '-' }}
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
        <el-descriptions-item :span="2" label="备注">{{ detailData.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="mb-16px mt-24px text-18px font-bold">商品明细</div>
      <el-table :data="detailData.details || []" :summary-method="getSummaries" border show-summary>
        <el-table-column label="商品信息" min-width="200">
          <template #default="{ row }">
            <div>{{ row.itemName || '-' }}</div>
            <div v-if="row.itemCode" class="text-12px text-gray-500">商品编号：{{ row.itemCode }}</div>
          </template>
        </el-table-column>
        <el-table-column label="规格信息" min-width="200">
          <template #default="{ row }">
            <div>{{ row.skuName || '-' }}</div>
            <div v-if="row.skuCode" class="text-12px text-gray-500">规格编号：{{ row.skuCode }}</div>
          </template>
        </el-table-column>
        <el-table-column label="批号" min-width="140" prop="batchNo" />
        <el-table-column align="right" label="账面数量" prop="quantity" width="120">
          <template #default="{ row }">{{ formatQuantity(row.quantity) || '-' }}</template>
        </el-table-column>
        <el-table-column align="right" label="实盘数量" prop="checkQuantity" width="120">
          <template #default="{ row }">{{ formatQuantity(row.checkQuantity) || '-' }}</template>
        </el-table-column>
        <el-table-column align="right" label="盈亏数量" prop="differenceQuantity" width="120">
          <template #default="{ row }">{{ formatQuantity(row.differenceQuantity) || '-' }}</template>
        </el-table-column>
        <el-table-column align="right" label="金额(元)" prop="amount" width="140">
          <template #default="{ row }">{{ formatPrice(row.amount) || '-' }}</template>
        </el-table-column>
      </el-table>
    </div>
  </Dialog>
</template>

<script lang="ts" setup>
import { formatNullableDate } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { CheckOrderApi, CheckOrderVO } from '@/api/wms/order/check'
import { CheckOrderDetailVO } from '@/api/wms/order/check/detail'
import { AREA_ENABLE } from '@/views/wms/utils/config'
import { formatPrice, formatQuantity, formatSumPrice, formatSumQuantity } from '@/views/wms/utils/format'

/** WMS 盘库单详情 */
defineOptions({ name: 'WmsCheckOrderDetail' })

const loading = ref(false)
const dialogVisible = ref(false)
const detailData = ref<CheckOrderVO>({})

const getSummaries = ({ columns, data }: { columns: any[]; data: CheckOrderDetailVO[] }) =>
  columns.map((column, index) => {
    if (index === 0) return '合计'
    if (column.property === 'quantity') return formatSumQuantity(data, (detail) => detail.quantity)
    if (column.property === 'checkQuantity') return formatSumQuantity(data, (detail) => detail.checkQuantity)
    if (column.property === 'differenceQuantity') return formatSumQuantity(data, (detail) => detail.differenceQuantity)
    if (column.property === 'amount') return formatSumPrice(data, (detail) => detail.amount)
    return ''
  })

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
