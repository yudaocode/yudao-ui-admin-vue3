<template>
  <div class="app-container">
    <el-table v-loading="loading" :data="batchList">
      <el-table-column label="生产工单号" width="150px" align="center" prop="workOrderCode" />
      <el-table-column label="批次编号" align="center" prop="code" />
      <el-table-column label="产品物料编码" align="center" prop="itemCode" />
      <el-table-column label="产品物料名称" align="center" prop="itemName" />
      <el-table-column label="规格型号" align="center" prop="itemSpecification" />
      <el-table-column label="单位" align="center" prop="unitName" />
    </el-table>
  </div>
</template>

<script lang="ts" setup>
import { BatchApi, BatchVO } from '@/api/mes/wm/batch'

defineOptions({ name: 'BatchTraceDetailList' })

const props = defineProps<{
  batchId?: number
  batchCode?: string
  direction: 'forward' | 'backward' // 追溯方向：forward=向前追溯，backward=向后追溯
}>()

const loading = ref(true) // 列表的加载中
const batchList = ref<BatchVO[]>([]) // 列表的数据

/** 查询列表 */
const getList = async () => {
  if (!props.batchCode) {
    return
  }
  loading.value = true
  try {
    batchList.value =
      props.direction === 'forward'
        ? await BatchApi.getForwardList(props.batchCode)
        : await BatchApi.getBackwardList(props.batchCode)
  } finally {
    loading.value = false
  }
}

/** 监听批次编号变化 */
watch(
  () => props.batchCode,
  (val) => {
    if (val) {
      getList()
    }
  }
)

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
