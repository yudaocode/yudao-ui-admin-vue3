<!-- MES 生产任务投料列表 -->
<!-- TODO @芋艿：待 review -->
<!-- TODO @芋艿：投料记录依赖仓库模块的领料出库单（wm_issue），当前仓库模块未迁移，先展示列表 -->
<template>
  <div>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="物料编码" align="center" prop="itemCode" width="120" />
      <el-table-column label="物料名称" align="center" prop="itemName" min-width="150" />
      <el-table-column label="规格" align="center" prop="itemSpec" width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="来源单据编码" align="center" prop="sourceDocCode" width="140" />
      <el-table-column label="来源类型" align="center" prop="sourceDocType" width="100" />
      <el-table-column label="批次" align="center" prop="batchCode" width="120" />
      <el-table-column label="投料数量" align="center" prop="issuedQuantity" width="100" />
      <el-table-column label="可用数量" align="center" prop="availableQuantity" width="100" />
      <el-table-column label="已用数量" align="center" prop="usedQuantity" width="100" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ProTaskIssueApi, ProTaskIssueVO } from '@/api/mes/pro/task/issue'

defineOptions({ name: 'ProTaskIssueList' })

const props = defineProps<{
  taskId: number
}>()

const loading = ref(false)
const list = ref<ProTaskIssueVO[]>([])

/** 查询投料列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await ProTaskIssueApi.getTaskIssueListByTask(props.taskId)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.taskId,
  () => getList()
)

onMounted(() => getList())
</script>
