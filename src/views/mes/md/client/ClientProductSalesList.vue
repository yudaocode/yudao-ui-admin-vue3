<template>
  <div class="overflow-hidden">
    <!-- 客户详情-销售记录 tab（复用 getProductSalesPage 分页接口） -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="出库单编号" align="center" prop="code" min-width="160">
        <template #default="scope">
          <el-button link type="primary" @click="handleDetail(scope.row.id)">
            {{ scope.row.code }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="出库单名称" align="center" prop="name" min-width="150" />
      <el-table-column
        label="出库日期"
        align="center"
        prop="salesDate"
        :formatter="dateFormatter2"
        width="180px"
      />
      <el-table-column label="单据状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_PRODUCT_SALES_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 销售出库单详情弹窗 -->
    <ProductSalesForm ref="formRef" />
  </div>
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { WmProductSalesApi } from '@/api/mes/wm/productsales'
import ProductSalesForm from '@/views/mes/wm/productsales/ProductSalesForm.vue'

defineOptions({ name: 'ClientProductSalesList' })

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
    const data = await WmProductSalesApi.getProductSalesPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 查看详情 */
const formRef = ref()
const handleDetail = (id: number) => {
  formRef.value.open('detail', id)
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
