<!-- MES 生产工单 BOM 列表子组件 -->
<!-- TODO @芋艿：这块暂时还没测试和 review； -->
<template>
  <div>
    <!-- 操作栏 -->
    <!-- TODO @AI：貌似没新增操作？在确认下 -->
    <el-row class="mb-10px" v-if="!disabled">
      <el-button type="primary" plain @click="openBomForm('create')">
        <Icon icon="ep:plus" class="mr-5px" /> 添加物料
      </el-button>
    </el-row>
    <!-- BOM 列表 -->
    <el-table v-loading="loading" :data="bomList" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="BOM 物料编码" align="center" prop="itemCode" width="120" />
      <el-table-column label="BOM 物料名称" align="center" prop="itemName" min-width="150" />
      <el-table-column label="规格型号" align="center" prop="itemSpec" width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="预计使用量" align="center" prop="quantity" width="120" />
      <el-table-column label="备注" align="center" prop="remark" min-width="120" />
      <el-table-column label="操作" align="center" width="130" v-if="!disabled">
        <template #default="scope">
          <el-button link type="primary" @click="openBomForm('update', scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDeleteBom(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="bomTotal"
      v-model:page="bomQueryParams.pageNo"
      v-model:limit="bomQueryParams.pageSize"
      @pagination="getBomList"
    />

    <!-- BOM 表单弹窗 -->
    <WorkOrderBomForm ref="bomFormRef" :work-order-id="workOrderId" @success="getBomList" />
  </div>
</template>

<script setup lang="ts">
import { ProWorkOrderBomApi, ProWorkOrderBomVO } from '@/api/mes/pro/workorder/bom'
import WorkOrderBomForm from './WorkOrderBomForm.vue'

defineOptions({ name: 'WorkOrderBomList' })

const props = defineProps<{
  workOrderId: number
  disabled?: boolean
}>()

const message = useMessage()
const { t } = useI18n()

// ==================== BOM 列表 ====================
const loading = ref(false)
const bomList = ref<ProWorkOrderBomVO[]>([])
const bomTotal = ref(0)
const bomQueryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  workOrderId: undefined as number | undefined
})

/** 查询 BOM 列表 */
const getBomList = async () => {
  loading.value = true
  try {
    bomQueryParams.workOrderId = props.workOrderId
    const data = await ProWorkOrderBomApi.getWorkOrderBomPage(bomQueryParams)
    bomList.value = data.list
    bomTotal.value = data.total
  } finally {
    loading.value = false
  }
}

/** 删除 BOM */
const handleDeleteBom = async (id: number) => {
  try {
    await message.delConfirm()
    await ProWorkOrderBomApi.deleteWorkOrderBom(id)
    message.success(t('common.delSuccess'))
    await getBomList()
  } catch {}
}

// ==================== BOM 表单 ====================
const bomFormRef = ref()

/** 打开 BOM 表单弹窗 */
const openBomForm = (type: string, row?: any) => {
  bomFormRef.value.open(type, row)
}

// ==================== 初始化 ====================
onMounted(async () => {
  await getBomList()
})
</script>
