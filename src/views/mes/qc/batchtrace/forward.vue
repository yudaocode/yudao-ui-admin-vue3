<template>
  <div class="app-container">
    <el-button icon="Refresh" size="small" @click="resetQuery">刷新</el-button>
    <el-table v-loading="loading" :data="batchList">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="生产工单号" width="150px" align="center" prop="workOrderCode" />
      <el-table-column label="批次编号" align="center" prop="code" />
      <el-table-column label="产品物料编码" align="center" prop="itemCode" />
      <el-table-column label="产品物料名称" align="center" prop="itemName" />
      <el-table-column label="规格型号" align="center" prop="itemSpecification" />
      <el-table-column label="单位" align="center" prop="unitName" />
    </el-table>

    <Pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script setup lang="ts">
// TODO @AI：代码风格，对齐：/Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/system/user/index.vue
import { ref, watch } from 'vue'
import { BatchApi, BatchVO } from '@/api/mes/wm/batch'

const props = defineProps({
  batchId: {
    type: Number,
    default: null
  },
  batchCode: {
    type: String,
    default: null
  }
})

const loading = ref(true)
const total = ref(0)
const batchList = ref<BatchVO[]>([])
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
  batchCode: props.batchCode
})

watch(
  () => props.batchId,
  (val) => {
    if (val) {
      getList()
    }
  }
)

watch(
  () => props.batchCode,
  (val) => {
    if (val) {
      queryParams.value.batchCode = val
      getList()
    }
  }
)

const getList = async () => {
  if (!queryParams.value.batchCode) {
    return
  }
  loading.value = true
  try {
    const data = await BatchApi.getForwardList(queryParams.value.batchCode)
    batchList.value = data
    total.value = data.length
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  getList()
}

// 初始加载
getList()
</script>
