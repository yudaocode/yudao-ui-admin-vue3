<!-- MES 工单物料需求列表（只读） -->
<template>
  <el-table v-loading="loading" :data="itemList" :stripe="true" :show-overflow-tooltip="true">
    <el-table-column label="物料编码" align="center" prop="itemCode" width="120" />
    <el-table-column label="物料名称" align="center" prop="itemName" min-width="150" />
    <el-table-column label="规格型号" align="center" prop="itemSpec" width="120" />
    <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
    <el-table-column label="需求数量" align="center" prop="quantity" width="120" />
  </el-table>
</template>

<script setup lang="ts">
import { ProWorkOrderBomApi } from '@/api/mes/pro/workorder/bom'

defineOptions({ name: 'WorkOrderItemList' })

const props = defineProps<{
  workOrderId: number
}>()

const loading = ref(false)
const itemList = ref<any[]>([])

/** 查询物料需求列表 */
const getList = async () => {
  loading.value = true
  try {
    itemList.value = await ProWorkOrderBomApi.getWorkOrderBomItemListByWorkOrderId(props.workOrderId)
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => getList())
</script>
