<template>
  <div class="overflow-hidden">
    <!-- 客户详情-产品清单 tab（复用 getProductSalesLinePage 分页接口） -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="物料编码" align="center" prop="itemCode" width="140">
        <template #default="scope">
          <el-button link type="primary" @click="handleViewItem(scope.row.itemId)">
            {{ scope.row.itemCode }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="物料名称" align="center" prop="itemName" />
      <el-table-column label="规格型号" align="center" prop="specification" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" />
      <el-table-column label="出库数量" align="center" prop="quantity" />
      <el-table-column label="批次号" align="center" prop="batchCode" />
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 物料详情弹窗 -->
    <MdItemForm ref="itemFormRef" />
  </div>
</template>

<script setup lang="ts">
import { WmProductSalesLineApi } from '@/api/mes/wm/productsales/line'
import MdItemForm from '@/views/mes/md/item/MdItemForm.vue'

defineOptions({ name: 'ClientProductSalesLineList' })

const props = defineProps<{
  clientId: number
}>()

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  clientId: undefined as number | undefined
})

/** 查询列表 */
const getList = async () => {
  if (!queryParams.clientId) return
  loading.value = true
  try {
    const data = await WmProductSalesLineApi.getProductSalesLinePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 查看物料详情 */
const itemFormRef = ref()
const handleViewItem = (itemId: number) => {
  itemFormRef.value.open('detail', itemId)
}

/** 监听 clientId 变化，自动加载 */
watch(
  () => props.clientId,
  (val) => {
    queryParams.clientId = val
    queryParams.pageNo = 1
    getList()
  },
  { immediate: true }
)
</script>
