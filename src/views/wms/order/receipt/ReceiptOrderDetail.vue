<!-- WMS 入库单详情 -->
<template>
  <Dialog v-model="dialogVisible" title="入库单详情" width="1200px">
    <div v-loading="loading">
      <div class="mb-16px text-18px font-bold">单据信息</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="入库单号">{{ detailData.no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="入库类型">
          <dict-tag
            v-if="detailData.type !== undefined"
            :type="DICT_TYPE.WMS_RECEIPT_ORDER_TYPE"
            :value="detailData.type"
          />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="仓库">
          {{ detailData.warehouseName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="单据状态">
          <dict-tag
            v-if="detailData.status !== undefined"
            :type="DICT_TYPE.WMS_ORDER_STATUS"
            :value="detailData.status"
          />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="单据日期">
          {{ formatNullableDate(detailData.orderTime, 'YYYY-MM-DD') }}
        </el-descriptions-item>
        <el-descriptions-item label="供应商">
          {{ detailData.merchantName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="业务单号">
          {{ detailData.bizOrderNo || '-' }}
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
        <el-table-column label="商品名称" min-width="180" prop="itemName">
          <template #default="scope">
            <div>{{ scope.row.itemName || '-' }}</div>
            <div v-if="scope.row.itemCode" class="text-12px text-gray-500">
              商品编号：{{ scope.row.itemCode }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="规格名称" min-width="180" prop="skuName">
          <template #default="scope">
            <div>{{ scope.row.skuName || '-' }}</div>
            <div v-if="scope.row.skuCode" class="text-12px text-gray-500">
              规格编号：{{ scope.row.skuCode }}
            </div>
          </template>
        </el-table-column>
        <el-table-column align="right" label="数量" prop="quantity" width="120">
          <template #default="scope">
            {{ formatQuantity(scope.row.quantity) || '-' }}
          </template>
        </el-table-column>
        <el-table-column align="center" label="单位" prop="unit" width="100" />
        <el-table-column align="right" label="单价" prop="price" width="140">
          <template #default="scope">
            {{ formatPrice(scope.row.price) || '-' }}
          </template>
        </el-table-column>
        <el-table-column align="right" label="总价" prop="totalPrice" width="140">
          <template #default="scope">
            {{ formatPrice(scope.row.totalPrice) || '-' }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </Dialog>
</template>

<script lang="ts" setup>
import { formatNullableDate } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { ReceiptOrderApi, ReceiptOrderVO } from '@/api/wms/order/receipt'
import { ReceiptOrderDetailVO } from '@/api/wms/order/receipt/detail'
import {
  formatPrice,
  formatQuantity,
  formatSumPrice,
  formatSumQuantity,
  multiplyPrice
} from '@/views/wms/utils/format'

/** WMS 入库单详情 */
defineOptions({ name: 'WmsReceiptOrderDetail' })

interface DetailRow extends ReceiptOrderDetailVO {
  totalPrice?: number
}

const loading = ref(false) // 加载中
const dialogVisible = ref(false) // 弹窗的是否展示
const detailData = ref<ReceiptOrderVO>({}) // 详情数据
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
    detailData.value = await ReceiptOrderApi.getReceiptOrder(id)
  } finally {
    loading.value = false
  }
}
defineExpose({ open })
</script>
