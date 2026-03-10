<!-- MES 盘点任务结果列表子组件 -->
<template>
  <div>
    <el-table
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      border
    >
      <el-table-column type="index" label="#" width="60" />
      <el-table-column label="物料编码" prop="itemCode" min-width="140" />
      <el-table-column label="物料名称" prop="itemName" min-width="160" />
      <el-table-column label="规格" prop="specification" min-width="120" />
      <el-table-column label="单位" prop="unitMeasureName" width="90" />
      <el-table-column label="批次" prop="batchCode" min-width="120" />
      <el-table-column label="仓库" prop="warehouseName" min-width="120" />
      <el-table-column label="库区" prop="locationName" min-width="120" />
      <el-table-column label="库位" prop="areaName" min-width="120" />
      <el-table-column label="差异数量" prop="quantity" min-width="120" />
      <el-table-column label="备注" prop="remark" min-width="180" />
      <el-table-column label="生成时间" prop="createTime" min-width="180" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import {
  StockTakingResultApi,
  type StockTakingResultVO
} from '@/api/mes/wm/stocktaking/task/result/index'

defineOptions({ name: 'StockTakingTaskResultList' })

const props = defineProps<{
  taskId: number
}>()

const loading = ref(false)
const list = ref<StockTakingResultVO[]>([])

const getList = async () => {
  if (!props.taskId) return
  loading.value = true
  try {
    list.value = await StockTakingResultApi.getStockTakingResultList(props.taskId)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.taskId,
  () => {
    getList()
  },
  { immediate: true }
)

defineExpose({ getList })
</script>
