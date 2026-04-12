<template>
  <div class="overflow-hidden">
    <!-- 供应商详情-采购记录 tab -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="入库单编号" align="center" prop="receiptCode" min-width="160">
        <template #default="scope">
          <el-button link type="primary" @click="handleDetail(scope.row.receiptId)">
            {{ scope.row.receiptCode }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="采购订单号" align="center" prop="purchaseOrderCode" min-width="150" />
      <el-table-column label="物料编码" align="center" prop="itemCode" width="140" />
      <el-table-column label="物料名称" align="center" prop="itemName" min-width="150" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="入库数量" align="center" prop="receivedQuantity" width="100" />
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 采购入库单详情弹窗 -->
    <ItemReceiptForm ref="formRef" />
  </div>
</template>

<script setup lang="ts">
import { WmItemReceiptLineApi } from '@/api/mes/wm/itemreceipt/line'
import ItemReceiptForm from '@/views/mes/wm/itemreceipt/ItemReceiptForm.vue'

defineOptions({ name: 'VendorItemReceiptList' })

const props = defineProps<{
  vendorId: number
}>()

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  vendorId: undefined as number | undefined
})

/** 查询列表 */
const getList = async () => {
  if (!queryParams.vendorId) return
  loading.value = true
  try {
    const data = await WmItemReceiptLineApi.getItemReceiptLinePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 查看详情 */
const formRef = ref()
const handleDetail = (receiptId: number) => {
  formRef.value.open('detail', receiptId)
}

/** 监听 vendorId 变化，自动加载 */
watch(
  () => props.vendorId,
  (val) => {
    queryParams.vendorId = val
    queryParams.pageNo = 1
    getList()
  },
  { immediate: true }
)
</script>
